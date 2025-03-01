import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('📊 GET /api/opportunities/schema - Checking table schema');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get table info
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('opportunities')
      .select('*')
      .limit(1);
    
    if (tableInfoError) {
      console.error('❌ Error fetching table info:', tableInfoError);
      return NextResponse.json(
        { error: 'Failed to fetch table schema' },
        { status: 500 }
      );
    }

    // Get column names
    const columnNames = tableInfo && tableInfo.length > 0 
      ? Object.keys(tableInfo[0]) 
      : [];

    // Try to get more detailed schema info if available
    let detailedSchema = null;
    try {
      const { data: schemaInfo, error: schemaError } = await supabase.rpc(
        'get_schema_info',
        { table_name: 'opportunities' }
      );
      
      if (!schemaError && schemaInfo) {
        detailedSchema = schemaInfo;
      }
    } catch (error) {
      console.log('RPC not available for schema info:', error);
    }

    return NextResponse.json({
      columnNames,
      sampleData: tableInfo && tableInfo.length > 0 ? tableInfo[0] : null,
      detailedSchema,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/opportunities/schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table schema' },
      { status: 500 }
    );
  }
} 