/**
 * English interface texts: the reference table. Every other language must have exactly the same keys and parameter
 * types (the `Messages` type, enforced by TypeScript). A message is a string or a function of its parameters.
 * Money and times arrive already formatted (strings), so a language only words them.
 */
export const MESSAGES_EN = {
  'app.title': 'Finals Blueprint',
  'app.subtitle': 'Ranked Cashout money calculator and play advisor',
  'app.rulesVerified': (date: string) => `Rules last verified ${date}`,
  'fairplay.short':
    "Manual input only. This app does not read game memory, inject, hook, or capture the screen. Check Embark's fair-play rules yourself: no one can promise a third-party tool is safe.",

  // Round and clock
  'round.round1': 'Round 1',
  'round.round2': 'Round 2',
  'round.final': 'Final',
  'round.goalKnockout': 'Goal: top 2 by cash',
  'round.goalFinal': (target: string) => `Goal: first to ${target}`,
  'round.new': 'New round',
  'clock.label': 'Time left',
  'clock.start': 'Start clock',
  'clock.pause': 'Pause',
  'clock.overtime': 'OT',
  'clock.minus': (s: number) => `−${s}s`,
  'clock.plus': (s: number) => `+${s}s`,

  // Teams
  'team.us': 'Us',
  'team.b': 'Team B',
  'team.c': 'Team C',
  'team.d': 'Team D',
  'team.place': (place: number) => `#${place}`,
  'team.projected': (amount: string) => `${amount} incl. cashouts`,
  'team.edit': 'Team cash',
  'team.winner': 'Winner',

  // Our status
  'status.alive': 'Alive',
  'status.carrying': 'We carry a box',
  'status.notCarrying': 'No box',
  'status.nextBox': (vault: number, value: string) => `Next box: vault ${vault}, ${value}`,
  'status.nextBoxFinal': (value: string) => `Next box: ${value}`,

  // Events
  'events.title': 'What just happened',
  'event.vaultOpened': 'Vault opened',
  'event.deposit': 'Cashout started',
  'event.wiped': 'Team wiped',
  'event.elimination': '+1 elimination',
  'event.pickedUp': 'Picked up box',
  'event.droppedBox': 'Lost the box',
  'event.undo': 'Undo',
  'event.theirDeposit': 'Cashout',
  'event.theirWiped': 'Wiped',
  'event.theirVault': 'Vault',
  'event.noStation': 'Both stations are running',

  // Cashouts
  'cashouts.title': 'Running cashouts',
  'cashouts.none': 'No cashout running.',
  'cashout.owner': (team: string) => `${team}'s cashout`,
  'cashout.ours': 'Our cashout',
  'cashout.stored': (amount: string) => `${amount} stored`,
  'cashout.remaining': (time: string) => `${time} left`,
  'cashout.due': 'Should be done',
  'cashout.jeopardy': (team: string) => `Double Jeopardy: ${team}`,
  'cashout.stolenBy': 'Stolen by',
  'cashout.completed': 'Completed',
  'cashout.addBox': '+ box (Double Jeopardy)',

  // Advice
  'advice.title': 'Best plays now',
  'advice.none': 'Nothing to advise: the round is over.',
  'advice.expected': (cash: string, gain: string) => `Expected cash ${cash} (${gain})`,
  'advice.assumptions': 'Based on:',
  'advice.kind.depositNow': 'Deposit now',
  'advice.kind.hold': 'Hold',
  'advice.kind.defendCashout': 'Defend the cashbox',
  'advice.kind.stealCashout': 'Steal the cashout',
  'advice.kind.contestVault': 'Contest a vault',
  'advice.kind.avoidFight': 'Avoid a fight',
  'reason.deposit.free': (bonus: string, stored: string, p: string) =>
    `A box is worth nothing until inserted. You get ${bonus} now and ${stored} more if you hold the station (${p} chance).`,
  'reason.deposit.jeopardyOwn': (loss: string, p: string) =>
    `Both stations are running. Adding it to your own station triggers Double Jeopardy: if you lose the station you lose ${loss} (half your cash). ${p} chance to hold.`,
  'reason.deposit.jeopardyTheirs': (loss: string, p: string) =>
    `Both stations are running. Inserting into theirs triggers Double Jeopardy: unless you steal and hold it (${p} chance) you lose ${loss} (half your cash).`,
  'reason.hold.waitStation': (time: string, loss: string) =>
    `Keep the box. A station frees up in about ${time}; inserting now risks ${loss}.`,
  'reason.hold.safeLead': (margin: string) =>
    `You stay in the top 2 even in the worst case (${margin} ahead). Don't take risky fights.`,
  'reason.hold.respawn': (s: number) => `Team wiped: you respawn together in ${s} s. Your cashouts can still finish.`,
  'reason.defend': (stored: string, time: string, p: string) =>
    `${stored} is in the station with ${time} left. Stay on it: ${p} chance to hold.`,
  'reason.defend.decisive': 'This cashout decides the round.',
  'reason.steal': (team: string, stored: string, p: string) =>
    `${team} has ${stored} in a station. ${p} chance to steal it.`,
  'reason.steal.reward': (reward: string) => `Stealing pays ${reward}.`,
  'reason.steal.wins': 'If it completes they win the final.',
  'reason.steal.passesUs': 'If it completes they pass you for the top 2.',
  'reason.vault': (value: string, reward: string, p: string) =>
    `The next box is worth ${value}. Opening pays ${reward}; ${p} chance to get the box.`,
  'reason.avoid.lowAlive': (alive: number, risk: string) =>
    `Only ${alive} of you alive: regroup before fighting. A wipe would cost about ${risk}.`,
  'reason.avoid.noGoodFight': (risk: string) => `No fight is worth its risk now (expected wipe cost ${risk}).`,

  // Assumptions (not game facts)
  'assumption.odds.holdCashout': 'guessed chance to hold a cashout',
  'assumption.odds.steal': 'guessed chance to steal',
  'assumption.odds.winVault': 'guessed chance to win a vault fight',
  'assumption.odds.wipeInFight': 'guessed chance to get wiped',
  'assumption.vaultsLeftEstimate': 'estimated vaults left',
  'assumption.vault56Bonus': 'vault 5-6 bonus $4,000 (unconfirmed)',
  'assumption.knockoutCashoutS': 'cashout length 2:10 (unconfirmed)',
  'assumption.finalUsesInsertSplit': 'no 20 % split in the final (unconfirmed)',
  'assumption.finalWipeLossShare': 'no wipe penalty in the final (unconfirmed)',
  'assumption.extraBoxPaysBonus': 'extra box pays its bonus (unconfirmed)',
  'assumption.doubleJeopardyOnOwnStation': 'Double Jeopardy on your own station (unconfirmed)',
  'assumption.extraBoxTakesOwnership': 'extra box does not change the owner (unconfirmed)',
  'assumption.stealRestartsTimer': 'steal restarts the timer (unconfirmed)',
  'assumption.lateCashoutShortens': 'late cashouts end in overtime (unconfirmed)',
  'assumption.finalPaysVaultAndEliminationRewards': 'vault and kill rewards in the final (unconfirmed)',
};

/** The shape every language table must have: same keys, same parameters. */
export type Messages = { [K in keyof typeof MESSAGES_EN]: (typeof MESSAGES_EN)[K] };
