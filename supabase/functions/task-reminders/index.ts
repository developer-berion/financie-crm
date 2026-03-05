
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getCorrelationId, getSupabaseClient, logStructured, sendTaskReminderEmail } from "../shared-utils.ts"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

serve(async (req) => {
  const correlationId = getCorrelationId(req);

  // CORS for triggering from frontend if needed
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = getSupabaseClient();

    // 1. Fetch pending tasks due in the next 24 hours
    // We check tasks scheduled for reminders
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    logStructured('info', 'task_reminders', 'run_start', {
      correlation_id: correlationId,
      now_utc: now.toISOString(),
      due_before_utc: in24Hours.toISOString(),
    });

    // Get tasks that are pending and have a due date
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select(`
        id, 
        title, 
        due_at, 
        assigned_to, 
        reminders_sent,
        leads (full_name)
      `)
      .eq('status', 'pending')
      .not('due_at', 'is', null)
      .not('assigned_to', 'is', null)
      .lte('due_at', in24Hours.toISOString())
      .gt('due_at', now.toISOString())

    if (tasksError) throw tasksError

    logStructured('info', 'task_reminders', 'tasks_loaded', {
      correlation_id: correlationId,
      candidate_count: tasks?.length || 0,
    });

    let sentCount = 0

    for (const task of tasks || []) {
      const dueAt = new Date(task.due_at)
      const diffMs = dueAt.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      const remindersSent = task.reminders_sent || {}
      let reminderType: '24h' | '1h' | null = null

      // Check for 1h reminder (highest priority)
      if (diffHours <= 1.2 && !remindersSent['1h']) {
        reminderType = '1h'
      } 
      // Check for 24h reminder
      else if (diffHours <= 24.2 && diffHours > 20 && !remindersSent['24h']) {
        reminderType = '24h'
      }

      if (reminderType) {
        // Fetch Agent info
        const { data: agent, error: agentError } = await supabaseClient
          .from('agentes')
          .select('full_name, email')
          .eq('id', task.assigned_to)
          .single()

        if (agentError || !agent?.email) {
          logStructured('warn', 'task_reminders', 'missing_agent_email', {
            correlation_id: correlationId,
            task_id: task.id,
            assigned_to: task.assigned_to,
            error: agentError?.message || null,
          });
          continue
        }

        logStructured('info', 'task_reminders', 'sending_reminder', {
          correlation_id: correlationId,
          task_id: task.id,
          reminder_type: reminderType,
          assigned_to: task.assigned_to,
        });
        
        const emailResult = await sendTaskReminderEmail(
          { email: agent.email, name: agent.full_name },
          { 
            title: task.title, 
            due_at: task.due_at, 
            lead_name: task.leads?.full_name, 
            id: task.id 
          },
          reminderType
        )

        if (emailResult.success) {
          // Update task to mark reminder as sent
          const newRemindersSent = { ...remindersSent, [reminderType]: new Date().toISOString() }
          await supabaseClient
            .from('tasks')
            .update({ reminders_sent: newRemindersSent })
            .eq('id', task.id)
          
          sentCount++
          logStructured('info', 'task_reminders', 'reminder_sent', {
            correlation_id: correlationId,
            task_id: task.id,
            reminder_type: reminderType,
          });
        } else {
          logStructured('warn', 'task_reminders', 'reminder_send_failed', {
            correlation_id: correlationId,
            task_id: task.id,
            reminder_type: reminderType,
            error: emailResult.error || null,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sentCount, correlation_id: correlationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    logStructured('error', 'task_reminders', 'run_failed', {
      correlation_id: correlationId,
      error: errorMessage,
    });
    return new Response(
      JSON.stringify({ error: errorMessage, correlation_id: correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
