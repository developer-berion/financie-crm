
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key) env[key.trim()] = rest.join('=').trim().replace(/(^"|"$)/g, '');
    });
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testTrigger() {
    console.log(`\n🧪 Testing Automatic Trigger Logic...`);

    // 1. Create Test Lead
    const uniqueId = `test_${Date.now()}`;
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
            full_name: 'Trigger Test User',
            phone: '+15550000000',
            status: 'TEST'
        })
        .select()
        .single();

    if (leadError) {
        console.error('❌ Error creating test lead:', leadError);
        return;
    }
    console.log(`✅ Created Test Lead: ${lead.id}`);

    try {
        // 2. Insert Call Schedule
        const testTime = new Date();
        testTime.setHours(testTime.getHours() + 24); // Tomorrow
        const testTimeIso = testTime.toISOString();

        console.log(`\n👉 Action: Inserting Active Schedule for ${testTimeIso}...`);
        const { data: schedule, error: schedError } = await supabase
            .from('call_schedules')
            .insert({
                lead_id: lead.id,
                active: true,
                next_attempt_at: testTimeIso,
                attempts_today: 0
            })
            .select()
            .single();

        if (schedError) throw schedError;

        // Wait a moment for trigger
        await new Promise(r => setTimeout(r, 1000));

        // 3. Check Job Creation
        const { data: job1 } = await supabase
            .from('jobs')
            .select('*')
            .eq('lead_id', lead.id)
            .eq('type', 'INITIAL_CALL')
            .single();

        if (job1 && job1.status === 'PENDING' && new Date(job1.scheduled_at).getTime() === new Date(testTimeIso).getTime()) {
            console.log(`✅ SUCCESS: Job created automatically via trigger!`);
            console.log(`   Job ID: ${job1.id}, Scheduled: ${job1.scheduled_at}`);
        } else {
            console.error(`❌ FAILURE: Job not created or incorrect.`);
            if (job1) console.log(`   Found Job:`, job1);
            else console.log(`   No job found.`);
        }

        // 4. Update Schedule
        const updateTime = new Date();
        updateTime.setHours(updateTime.getHours() + 48); // Day after tomorrow
        const updateTimeIso = updateTime.toISOString();

        console.log(`\n👉 Action: Updating Schedule to ${updateTimeIso}...`);
        await supabase
            .from('call_schedules')
            .update({ next_attempt_at: updateTimeIso })
            .eq('id', schedule.id);

        // Wait a moment
        await new Promise(r => setTimeout(r, 1000));

        // 5. Check Job Update
        const { data: job2 } = await supabase
            .from('jobs')
            .select('*')
            .eq('lead_id', lead.id)
            .eq('type', 'INITIAL_CALL')
            .single();

        if (job2 && new Date(job2.scheduled_at).getTime() === new Date(updateTimeIso).getTime()) {
            console.log(`✅ SUCCESS: Job updated automatically via trigger!`);
        } else {
            console.error(`❌ FAILURE: Job not updated.`);
            console.log(`   Expected: ${updateTimeIso}`);
            console.log(`   Actual:   ${job2?.scheduled_at}`);
        }

    } catch (err) {
        console.error('❌ Test Exception:', err);
    } finally {
        // Cleanup
        console.log(`\n🧹 Cleaning up test data...`);
        await supabase.from('leads').delete().eq('id', lead.id); // Cascades to schedules and jobs
        console.log(`✅ Cleanup complete.`);
    }
}

testTrigger();
