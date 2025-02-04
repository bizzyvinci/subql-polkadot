import { SubstrateEvent } from "@subql/types";
import { Transfer } from "../types";
import { Balance } from "@polkadot/types/interfaces";
import { Account } from '../types/models/Account';
import { tokens } from '../helpers/token'

async function ensureAccounts(accountIds: string[]): Promise<void> {
    for (const accountId of accountIds) {
        const account = await Account.get(accountId);
        if (!account) {
            await new Account(accountId).save();
        }
    }
}


export async function handleTransfer(event: SubstrateEvent): Promise<void> {
    const DOT_REDENOMINATION_BLOCK = 1248328
    const {
        event: {
            data: [from, to, amount],
        },
    } = event;
    const blockNo = event.block.block.header.number.toNumber();
    const decimals = blockNo >= DOT_REDENOMINATION_BLOCK ?  BigInt("1" + "0".repeat(tokens.DOT.decimals.new)) :  BigInt("1" + "0".repeat(tokens.DOT.decimals.old))
    const transformedAmount = (amount as Balance).toBigInt();
    const extrinsicHash = event.extrinsic.extrinsic.hash.toString();
    const timestamp = event.extrinsic.block.timestamp;
    const transferInfo = new Transfer(`${blockNo}-${event.idx}`);
    const isSuccess = event.extrinsic.success;

    await ensureAccounts([from.toString(), to.toString()]);

    transferInfo.token = tokens.DOT.name;
    transferInfo.fromId = from.toString();
    transferInfo.toId = to.toString();
    transferInfo.timestamp = timestamp;
    transferInfo.extrinsicHash = extrinsicHash;
    transferInfo.amount = transformedAmount;
    transferInfo.status = isSuccess;
    transferInfo.decimals = decimals;
    
    await transferInfo.save();
}
