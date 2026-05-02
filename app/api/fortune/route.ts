import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Connection, clusterApiUrl } from '@solana/web3.js'

const REQUIRED_LAMPORTS = 100_000_000
const RECEIVER = process.env.NEXT_PUBLIC_RECEIVER_WALLET!

export async function POST(req: NextRequest) {
  try {
    const { txSig, name, dob, time, city } = await req.json()

    if (!txSig) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const tx = await connection.getParsedTransaction(txSig, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 402 })
    }

    let verified = false
    for (const ix of tx.transaction.message.instructions) {
      if (
        'parsed' in ix &&
        ix.parsed?.type === 'transfer' &&
        ix.parsed?.info?.destination === RECEIVER &&
        parseInt(ix.parsed?.info?.lamports) >= REQUIRED_LAMPORTS
      ) {
        verified = true
        break
      }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{
        role: 'user',
        content: `You are a mystical fortune teller. Give a personal, vivid, 3-paragraph fortune for:
Name: ${name}
Date of birth: ${dob}
${time ? `Time of birth: ${time}` : ''}
${city ? `Birth city: ${city}` : ''}

Reference their birth details meaningfully. Be poetic, specific, and mysterious.`
      }],
      max_tokens: 500,
    })

    console.log('GPT response:', JSON.stringify(completion.choices[0]))

    const fortune = completion.choices[0].message.content

    console.log('Fortune text:', fortune)

    if (!fortune) {
      return NextResponse.json({ error: 'GPT returned empty response' }, { status: 500 })
    }

    return NextResponse.json({ fortune })

  } catch (e: any) {
    console.error('Fortune API error:', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}