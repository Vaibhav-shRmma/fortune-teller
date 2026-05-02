'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'

const WalletMultiButton = dynamic(
  () =>
    import('@solana/wallet-adapter-react-ui').then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
)

type Step = 'connect' | 'pay' | 'form' | 'loading' | 'result'

export default function Home() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [step, setStep] = useState<Step>('connect')
  const [txSig, setTxSig] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [time, setTime] = useState('')
  const [city, setCity] = useState('')
  const [fortune, setFortune] = useState('')
  const [error, setError] = useState('')

  async function handlePay() {
    if (!publicKey) return

    setError('')

    try {
      const receiver = new PublicKey(
        process.env.NEXT_PUBLIC_RECEIVER_WALLET!
      )

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: receiver,
          lamports: 100_000_000, // 0.1 SOL
        })
      )

      const sig = await sendTransaction(tx, connection)

      await connection.confirmTransaction(sig, 'confirmed')

      setTxSig(sig)
      setStep('form')
    } catch (e: any) {
      setError(e.message || 'Payment failed')
    }
  }

  async function handleFortune() {
    if (!name || !dob) {
      setError('Name and birth date are required')
      return
    }

    setStep('loading')
    setError('')

    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txSig,
          name,
          dob,
          time,
          city,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Unknown error')
        setStep('form')
        return
      }

      if (!data.fortune) {
        setError('No fortune returned')
        setStep('form')
        return
      }

      setFortune(data.fortune)
      setStep('result')
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setStep('form')
    }
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '60px auto',
        padding: '0 20px',
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        🔮 Fortune Teller
      </h1>

      <p
        style={{
          color: '#888',
          fontSize: 13,
          marginBottom: 32,
        }}
      >
        Pay 0.1 SOL (devnet) · Get your AI-generated fortune
      </p>

      {step === 'connect' && (
        <div>
          <p
            style={{
              marginBottom: 16,
              color: '#aaa',
              fontSize: 14,
            }}
          >
            Connect your Phantom wallet to begin.
          </p>

          <WalletMultiButton />

          {publicKey && (
            <button
              onClick={() => setStep('pay')}
              style={btnStyle}
            >
              Continue →
            </button>
          )}
        </div>
      )}

      {step === 'pay' && (
        <div>
          <p
            style={{
              fontSize: 14,
              color: '#aaa',
              marginBottom: 8,
            }}
          >
            Connected:{' '}
            {publicKey?.toBase58().slice(0, 8)}...
          </p>

          <p
            style={{
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            Send <strong>0.1 SOL</strong> (devnet) to
            unlock your fortune.
          </p>

          <button
            onClick={handlePay}
            style={btnStyle}
          >
            Pay 0.1 SOL
          </button>

          {error && (
            <p
              style={{
                color: '#f66',
                marginTop: 12,
                fontSize: 13,
              }}
            >
              {error}
            </p>
          )}
        </div>
      )}

      {step === 'form' && (
        <div>
          <p
            style={{
              fontSize: 13,
              color: '#4a4',
              marginBottom: 20,
            }}
          >
            ✓ Payment confirmed. Enter your birth
            details.
          </p>

          <label style={labelStyle}>
            Your name
          </label>

          <input
            style={inputStyle}
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Full name"
          />

          <label style={labelStyle}>
            Date of birth
          </label>

          <input
            style={inputStyle}
            type="date"
            value={dob}
            onChange={(e) =>
              setDob(e.target.value)
            }
          />

          <label style={labelStyle}>
            Time of birth (optional)
          </label>

          <input
            style={inputStyle}
            type="time"
            value={time}
            onChange={(e) =>
              setTime(e.target.value)
            }
          />

          <label style={labelStyle}>
            Birth city (optional)
          </label>

          <input
            style={inputStyle}
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
            placeholder="e.g. Mumbai"
          />

          <button
            onClick={handleFortune}
            style={btnStyle}
          >
            Reveal My Fortune →
          </button>

          {error && (
            <p
              style={{
                color: '#f66',
                marginTop: 12,
                fontSize: 13,
              }}
            >
              {error}
            </p>
          )}
        </div>
      )}

      {step === 'loading' && (
        <p
          style={{
            color: '#aaa',
            fontSize: 14,
          }}
        >
          The stars are aligning...
        </p>
      )}

      {step === 'result' && (
        <div>
          <p
            style={{
              fontSize: 13,
              color: '#888',
              marginBottom: 12,
            }}
          >
            Your fortune:
          </p>

          <div
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 8,
              padding: 20,
              fontSize: 15,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {fortune}
          </div>

          <button
            onClick={() => {
              setStep('connect')
              setFortune('')
              setTxSig('')
            }}
            style={{
              ...btnStyle,
              marginTop: 20,
              background: '#111',
            }}
          >
            Start Over
          </button>
        </div>
      )}
    </main>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'block',
  marginTop: 16,
  padding: '10px 20px',
  background: '#222',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#f0f0f0',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'monospace',
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginBottom: 16,
  padding: '8px 10px',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 5,
  color: '#f0f0f0',
  fontSize: 14,
  fontFamily: 'monospace',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#888',
  marginBottom: 4,
}