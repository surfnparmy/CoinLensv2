import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(req: Request) {
  try {
    const { address, message, signature } = await req.json();
    
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const verified = recoveredAddress.toLowerCase() === address.toLowerCase();

    return NextResponse.json({ verified });
  } catch (error) {
    console.error('Error verifying signature:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}