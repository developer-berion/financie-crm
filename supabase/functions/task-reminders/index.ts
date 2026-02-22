
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendTaskReminderEmail, corsHeaders } from "../shared-utils.ts"

serve(async (req) => {
  // CORS for triggering from frontend if needed
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch pending tasks due in the next 24 hours
    // We check tasks scheduled for reminders
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000)

    console.log(`[TaskReminders] Running check at ${now.toISOString()}`)

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

    console.log(`[TaskReminders] Found ${tasks?.length || 0} potential tasks for reminders`)

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
          console.warn(`[TaskReminders] Could not find agent/email for task ${task.id}:`, agentError)
          continue
        }

        console.log(`[TaskReminders] Sending ${reminderType} reminder for task ${task.id} to ${agent.email}`)
        
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
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sentCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[TaskReminders] Fatal Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
