import { type Dispatch, type ReactNode, useEffect, useMemo, useReducer, useState } from 'react';
import { type Advice, type AssumptionId, type Reason, recommend } from './services/advisor';
import {
  type MatchEvent,
  type MatchState,
  type TeamId,
  applyEvent,
  cashoutRemainingS,
  newMatch,
  splitDeposit,
  standings,
  teamsOf,
} from './services/money';
import { type Round, RULES, RULES_VERIFIED_ON, boxValue, roundKind } from './services/rules';
import { I18nContext, type MessageKey, makeI18n, useI18n } from './i18n';

// ---------------------------------------------------------------------------------------------------------------
// State: the match plus an undo history (manual input makes mistakes)

interface AppState {
  match: MatchState;
  history: MatchState[];
  clockRunning: boolean;
}

type Action = { type: 'event'; event: MatchEvent } | { type: 'undo' } | { type: 'tick' } | { type: 'clock'; running: boolean };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'event': {
      const match = applyEvent(state.match, action.event);
      if (match === state.match) return state;
      return { ...state, match, history: [...state.history, state.match].slice(-100) };
    }
    case 'undo':
      if (!state.history.length) return state;
      return { ...state, match: state.history[state.history.length - 1], history: state.history.slice(0, -1) };
    case 'tick': {
      const match = applyEvent(state.match, { type: 'setTime', timeLeftS: state.match.timeLeftS - 1 });
      const over = match.timeLeftS <= -RULES.OVERTIME_MAX_S || (match.timeLeftS <= 0 && match.cashouts.length === 0);
      return { ...state, match, clockRunning: state.clockRunning && !over };
    }
    case 'clock':
      return { ...state, clockRunning: action.running };
  }
}

const ROUNDS: Round[] = ['round1', 'round2', 'final'];

const ASSUMPTION_TEXT: Record<AssumptionId, MessageKey> = {
  'odds.holdCashout': 'assumption.odds.holdCashout',
  'odds.steal': 'assumption.odds.steal',
  'odds.winVault': 'assumption.odds.winVault',
  'odds.wipeInFight': 'assumption.odds.wipeInFight',
  vaultsLeftEstimate: 'assumption.vaultsLeftEstimate',
  vault56Bonus: 'assumption.vault56Bonus',
  knockoutCashoutS: 'assumption.knockoutCashoutS',
  finalUsesInsertSplit: 'assumption.finalUsesInsertSplit',
  finalWipeLossShare: 'assumption.finalWipeLossShare',
  extraBoxPaysBonus: 'assumption.extraBoxPaysBonus',
  doubleJeopardyOnOwnStation: 'assumption.doubleJeopardyOnOwnStation',
  extraBoxTakesOwnership: 'assumption.extraBoxTakesOwnership',
  stealRestartsTimer: 'assumption.stealRestartsTimer',
  lateCashoutShortens: 'assumption.lateCashoutShortens',
  finalPaysVaultAndEliminationRewards: 'assumption.finalPaysVaultAndEliminationRewards',
};

// ---------------------------------------------------------------------------------------------------------------
// Small building blocks

const btn =
  'min-h-11 rounded-md border px-3 py-2 text-body font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
const btnPrimary = `${btn} border-finals-cash bg-finals-cash text-finals-bg hover:brightness-110`;
const btnDanger = `${btn} border-finals-bad/60 bg-finals-bad/10 text-finals-bad hover:bg-finals-bad/20`;
const btnPlain = `${btn} border-finals-border bg-finals-panelLight text-finals-text hover:border-finals-muted`;

function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-finals-border bg-finals-panel p-3 ${className}`}>
      {title && <h2 className="mb-2 text-title font-semibold text-finals-text">{title}</h2>}
      {children}
    </section>
  );
}

function useTeamName() {
  const { t } = useI18n();
  return (team: TeamId) => t(`team.${team}` as const);
}

// ---------------------------------------------------------------------------------------------------------------

function Header({ match, running, dispatch }: { match: MatchState; running: boolean; dispatch: Dispatch<Action> }) {
  const { t, formatDuration, formatMoney } = useI18n();
  const overtime = match.timeLeftS < 0;
  const send = (event: MatchEvent) => dispatch({ type: 'event', event });
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-heading font-bold">{t('app.title')}</h1>
          <p className="text-small text-finals-muted">
            {t('app.subtitle')} · {t('app.rulesVerified', RULES_VERIFIED_ON)}
          </p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Round">
          {ROUNDS.map((r) => (
            <button
              key={r}
              className={match.round === r ? btnPrimary : btnPlain}
              onClick={() => {
                dispatch({ type: 'clock', running: false });
                send({ type: 'newRound', round: r });
              }}
            >
              {t(`round.${r}` as const)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="mr-2">
          <div className="text-small text-finals-muted">{t('clock.label')}</div>
          <div className={`text-heading font-bold tabular-nums ${overtime ? 'text-finals-warn' : ''}`}>
            {overtime ? `${t('clock.overtime')} ${formatDuration(-match.timeLeftS)}` : formatDuration(match.timeLeftS)}
          </div>
        </div>
        <button className={running ? btnPlain : btnPrimary} onClick={() => dispatch({ type: 'clock', running: !running })}>
          {running ? t('clock.pause') : t('clock.start')}
        </button>
        {[-30, -10, 10].map((d) => (
          <button key={d} className={btnPlain} onClick={() => send({ type: 'setTime', timeLeftS: match.timeLeftS + d })}>
            {d < 0 ? t('clock.minus', -d) : t('clock.plus', d)}
          </button>
        ))}
        <span className="ml-auto text-body text-finals-muted">
          {roundKind(match.round) === 'final'
            ? t('round.goalFinal', formatMoney(RULES.FINAL_TARGET_CASH))
            : t('round.goalKnockout')}
        </span>
      </div>
    </Panel>
  );
}

function TeamMoney({ match, dispatch }: { match: MatchState; dispatch: Dispatch<Action> }) {
  const { t, formatMoney } = useI18n();
  const teamName = useTeamName();
  const rows = standings(match);
  const freeStation = match.cashouts.length < RULES.STATIONS_ACTIVE;
  const send = (event: MatchEvent) => dispatch({ type: 'event', event });
  return (
    <Panel title={t('team.edit')}>
      <ul className="flex flex-col gap-2">
        {teamsOf(match.round).map((team) => {
          const row = rows.find((r) => r.team === team)!;
          const qualifies = roundKind(match.round) === 'knockout' && row.place <= RULES.KNOCKOUT_QUALIFIERS;
          return (
            <li
              key={team}
              className={`flex flex-wrap items-center gap-2 rounded-md border p-2 ${
                team === 'us' ? 'border-finals-cash/60 bg-finals-cash/5' : 'border-finals-border'
              }`}
            >
              <span className={`w-6 text-body font-bold ${qualifies ? 'text-finals-good' : 'text-finals-muted'}`}>
                {t('team.place', row.place)}
              </span>
              <span className="w-16 text-body font-semibold">{teamName(team)}</span>
              <span className="flex flex-col">
                <CashInput value={match.cash[team]} onChange={(cash) => send({ type: 'setCash', team, cash })} />
                {row.projected !== row.cash && (
                  <span className="text-small text-finals-muted">{t('team.projected', formatMoney(row.projected))}</span>
                )}
              </span>
              {match.winner === team && <span className="text-body font-bold text-finals-cash">{t('team.winner')}</span>}
              {team !== 'us' && (
                <span className="ml-auto flex gap-1">
                  <button className={btnPlain} onClick={() => send({ type: 'vaultOpened', team })}>
                    {t('event.theirVault')}
                  </button>
                  <button
                    className={btnPlain}
                    disabled={!freeStation}
                    title={freeStation ? undefined : t('event.noStation')}
                    onClick={() => send({ type: 'deposit', team })}
                  >
                    {t('event.theirDeposit')}
                  </button>
                  <button className={btnDanger} onClick={() => send({ type: 'teamWiped', team })}>
                    {t('event.theirWiped')}
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function CashInput({ value, onChange }: { value: number; onChange: (cash: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft.replace(/[^\d]/g, ''));
    if (Number.isFinite(n)) onChange(n);
    setDraft(null);
  };
  return (
    <input
      inputMode="numeric"
      aria-label="Cash"
      className="min-h-11 w-28 rounded-md border border-finals-border bg-finals-bg px-2 text-title font-bold tabular-nums text-finals-cash focus:border-finals-cash focus:outline-none"
      value={draft ?? `$${value.toLocaleString('en-US')}`}
      onFocus={(e) => {
        setDraft(String(value));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

function OurEvents({ app, dispatch }: { app: AppState; dispatch: Dispatch<Action> }) {
  const { t, formatMoney } = useI18n();
  const { match } = app;
  const send = (event: MatchEvent) => dispatch({ type: 'event', event });
  const vault = match.boxesInserted + 1;
  const freeStation = match.cashouts.length < RULES.STATIONS_ACTIVE;
  return (
    <Panel title={t('events.title')}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-body text-finals-muted">{t('status.alive')}</span>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            className={`${match.usAlive === n ? btnPrimary : btnPlain} w-11`}
            onClick={() => send({ type: 'setAlive', alive: n })}
          >
            {n}
          </button>
        ))}
        <span className="ml-auto text-small text-finals-muted">
          {roundKind(match.round) === 'final'
            ? t('status.nextBoxFinal', formatMoney(boxValue(match.round, vault)))
            : t('status.nextBox', vault, formatMoney(boxValue(match.round, vault)))}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          className={match.usCarrying ? btnPlain : btnPrimary}
          onClick={() => send({ type: 'setCarrying', carrying: !match.usCarrying })}
        >
          {match.usCarrying ? t('event.droppedBox') : t('event.pickedUp')}
        </button>
        <button
          className={btnPrimary}
          disabled={!freeStation}
          title={freeStation ? undefined : t('event.noStation')}
          onClick={() => send({ type: 'deposit', team: 'us' })}
        >
          {t('event.deposit')} (+{formatMoney(splitDeposit(match.round, vault).bonus)})
        </button>
        <button className={btnPlain} onClick={() => send({ type: 'vaultOpened', team: 'us' })}>
          {t('event.vaultOpened')}
        </button>
        <button className={btnPlain} onClick={() => send({ type: 'elimination', team: 'us' })}>
          {t('event.elimination')}
        </button>
        <button className={btnDanger} onClick={() => send({ type: 'teamWiped', team: 'us' })}>
          {t('event.wiped')}
        </button>
        <button className={btnPlain} disabled={!app.history.length} onClick={() => dispatch({ type: 'undo' })}>
          ↶ {t('event.undo')}
        </button>
      </div>
      <p className="mt-2 text-small text-finals-muted">
        {match.usCarrying ? t('status.carrying') : t('status.notCarrying')}
      </p>
    </Panel>
  );
}

function Cashouts({ match, dispatch }: { match: MatchState; dispatch: Dispatch<Action> }) {
  const { t, formatMoney, formatDuration } = useI18n();
  const teamName = useTeamName();
  const send = (event: MatchEvent) => dispatch({ type: 'event', event });
  return (
    <Panel title={t('cashouts.title')}>
      {match.cashouts.length === 0 && <p className="text-body text-finals-muted">{t('cashouts.none')}</p>}
      <ul className="flex flex-col gap-2">
        {match.cashouts.map((c) => {
          const remaining = cashoutRemainingS(match, c);
          return (
            <li
              key={c.id}
              className={`rounded-md border p-2 ${c.owner === 'us' ? 'border-finals-good/60' : 'border-finals-bad/50'}`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-title font-semibold">{c.owner === 'us' ? t('cashout.ours') : t('cashout.owner', teamName(c.owner))}</span>
                <span className="text-title font-bold text-finals-cash">{t('cashout.stored', formatMoney(c.stored))}</span>
                <span className={`text-body ${remaining === 0 ? 'text-finals-warn' : 'text-finals-muted'}`}>
                  {remaining === 0 ? t('cashout.due') : t('cashout.remaining', formatDuration(remaining))}
                </span>
                {c.jeopardy && (
                  <span className="text-small text-finals-bad">{t('cashout.jeopardy', teamName(c.jeopardy))}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="mr-1 text-small text-finals-muted">{t('cashout.stolenBy')}</span>
                {teamsOf(match.round)
                  .filter((team) => team !== c.owner)
                  .map((team) => (
                    <button key={team} className={btnPlain} onClick={() => send({ type: 'stolen', cashoutId: c.id, by: team })}>
                      {teamName(team)}
                    </button>
                  ))}
                <button className={`${btnPrimary} ml-auto`} onClick={() => send({ type: 'completed', cashoutId: c.id })}>
                  {t('cashout.completed')}
                </button>
              </div>
              {match.usCarrying && (
                <button
                  className={`${btnDanger} mt-2 w-full`}
                  onClick={() => send({ type: 'deposit', team: 'us', cashoutId: c.id })}
                >
                  {t('cashout.addBox')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function reasonText(reason: Reason, i18n: ReturnType<typeof useI18n>, teamName: (t: TeamId) => string): string {
  const { t, formatMoney: m, formatDuration } = i18n;
  const p = (x: number) => `${Math.round(x * 100)}%`;
  switch (reason.code) {
    case 'deposit.free':
      return t('reason.deposit.free', m(reason.bonus), m(reason.stored), p(reason.pHold));
    case 'deposit.jeopardy':
      return reason.ownStation
        ? t('reason.deposit.jeopardyOwn', m(reason.loss), p(reason.pOwn))
        : t('reason.deposit.jeopardyTheirs', m(reason.loss), p(reason.pOwn));
    case 'hold.waitStation':
      return t('reason.hold.waitStation', formatDuration(reason.freeInS), m(reason.loss));
    case 'hold.safeLead':
      return t('reason.hold.safeLead', m(reason.margin));
    case 'hold.respawn':
      return t('reason.hold.respawn', reason.respawnS);
    case 'defend':
      return [
        t('reason.defend', m(reason.stored), formatDuration(reason.remainingS), p(reason.pHold)),
        reason.decisive ? t('reason.defend.decisive') : '',
      ].join(' ').trim();
    case 'steal':
      return [
        t('reason.steal', teamName(reason.owner), m(reason.stored), p(reason.pSteal)),
        reason.threat === 'wins' ? t('reason.steal.wins') : reason.threat === 'passesUs' ? t('reason.steal.passesUs') : '',
        reason.reward > 0 ? t('reason.steal.reward', m(reason.reward)) : '',
      ].filter(Boolean).join(' ');
    case 'vault':
      return t('reason.vault', m(reason.value), m(reason.reward), p(reason.pBox));
    case 'avoid.lowAlive':
      return t('reason.avoid.lowAlive', reason.alive, m(reason.risk));
    case 'avoid.noGoodFight':
      return t('reason.avoid.noGoodFight', m(reason.risk));
  }
}

function AdviceList({ advice }: { advice: Advice[] }) {
  const i18n = useI18n();
  const { t, formatMoney } = i18n;
  const teamName = useTeamName();
  return (
    <Panel title={t('advice.title')} className="border-finals-cash/40">
      {advice.length === 0 && <p className="text-body text-finals-muted">{t('advice.none')}</p>}
      <ol className="flex flex-col gap-2">
        {advice.slice(0, 3).map((x, i) => (
          <li
            key={`${x.kind}-${x.cashoutId ?? ''}-${i}`}
            className={`rounded-md border p-3 ${i === 0 ? 'border-finals-cash bg-finals-cash/10' : 'border-finals-border bg-finals-panelLight'}`}
          >
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className={`text-heading font-bold ${i === 0 ? 'text-finals-cash' : ''}`}>
                {i + 1}. {t(`advice.kind.${x.kind}` as const)}
              </span>
              <span className="text-body text-finals-muted">
                {t('advice.expected', formatMoney(x.expectedCash), `${x.expectedGain >= 0 ? '+' : ''}${formatMoney(x.expectedGain)}`)}
              </span>
            </div>
            <p className="mt-1 text-body">{reasonText(x.reason, i18n, teamName)}</p>
            {x.assumptions.length > 0 && (
              <p className="mt-1 text-small text-finals-muted">
                {t('advice.assumptions')} {x.assumptions.map((id) => t(ASSUMPTION_TEXT[id])).join(' · ')}
              </p>
            )}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function Main() {
  const { t } = useI18n();
  const [app, dispatch] = useReducer(reducer, undefined, () => ({ match: newMatch('round1'), history: [], clockRunning: false }));
  const advice = useMemo(() => recommend(app.match), [app.match]);

  useEffect(() => {
    if (!app.clockRunning) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [app.clockRunning]);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-3 bg-finals-bg p-3 text-body text-finals-text">
      <Header match={app.match} running={app.clockRunning} dispatch={dispatch} />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 md:order-2">
          <AdviceList advice={advice} />
          <Cashouts match={app.match} dispatch={dispatch} />
        </div>
        <div className="flex flex-col gap-3 md:order-1">
          <OurEvents app={app} dispatch={dispatch} />
          <TeamMoney match={app.match} dispatch={dispatch} />
        </div>
      </div>
      <p className="text-small text-finals-muted">{t('fairplay.short')}</p>
    </div>
  );
}

export default function App() {
  const i18n = useMemo(() => makeI18n('en'), []);
  return (
    <I18nContext.Provider value={i18n}>
      <Main />
    </I18nContext.Provider>
  );
}
