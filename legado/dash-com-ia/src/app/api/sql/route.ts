import { NextResponse } from 'next/server'
import { SQL_SEM_OPORTUNIDADE } from '@/lib/domain/jornada-fixtures'

export async function GET() {
  return NextResponse.json({ sql_sem_oportunidade: SQL_SEM_OPORTUNIDADE })
}
