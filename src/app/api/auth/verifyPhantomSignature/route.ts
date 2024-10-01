import { NextResponse } from 'next/server';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

export async function POST(req: Request) {
  try {
    const { publicKey, message, signedMessage } = await req.json();
    
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyBytes = bs58.decode(publicKey);
    const signatureBytes = new Uint8Array(signedMessage);

    const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    return NextResponse.json({ verified });
  } catch (error) {
    console.error('Error verifying Phantom signature:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}