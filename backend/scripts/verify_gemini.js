require('dotenv').config();
const settingService = require('../src/services/setting.service');
const menuAIService = require('../src/services/menuAI.service');
const aiChatService = require('../src/services/aiChat.service');
const { decrypt } = require('../src/utils/encryption');
const { supabase } = require('../src/config/supabase');

async function test() {
    console.log('--- STARTING COMPREHENSIVE INTEGRATION DIAGNOSTICS ---');
    
    // 1. Fetch key
    const { data } = await supabase
        .from('app_setting')
        .select('*')
        .eq('group', 'ai')
        .eq('key', 'gemini_api_key')
        .single();
        
    const key = data.is_encrypted ? decrypt(data.value) : data.value;
    console.log('Gemini API Key successfully retrieved and decrypted.');
    
    // 2. Test Connection
    console.log('\n--- TESTING CONNECTION ---');
    const connResult = await settingService.testConnection('gemini', key);
    console.log('Connection Test Result:', connResult);
    
    // 3. Test Menu AI Suggestions Job
    console.log('\n--- TESTING MENU AI SUGGESTIONS JOB ---');
    try {
        const jobResult = await menuAIService.runMenuAIJob();
        console.log('Menu Weekly job completed. Result:', jobResult);
    } catch (e) {
        console.error('Menu AI Job failed with error:', e.stack);
    }
    
    // 4. Test Message Builder
    console.log('\n--- TESTING AI CHAT MESSAGE BUILDER ---');
    const mockHistory = [
        { role: 'user', content: 'What were today\'s top-selling items?' },
        { role: 'assistant', content: 'Here are the top-selling items: ...' },
        { role: 'user', content: 'Thanks!' }
    ];
    const geminiMsgs = aiChatService._buildGeminiMessages(mockHistory);
    console.log('Gemini Message Conversion:', JSON.stringify(geminiMsgs, null, 2));

    console.log('\n--- DIAGNOSTICS COMPLETED ---');
}

test().catch(console.error);
