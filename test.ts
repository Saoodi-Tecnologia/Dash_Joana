import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tzhonyngvparefzoptqb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aG9ueW5ndnBhcmVmem9wdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzcwODcsImV4cCI6MjA2Mzk1MzA4N30.DhyNXEFbw0tqXc25si0ew8EUPLl3igntkueT5CSqd38'
);

async function main() {
  const { count, error } = await supabase
    .schema('dashboard')
    .from('dash_mensagens_realtime')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total messages from Supabase: ${count}`);
}

main();
