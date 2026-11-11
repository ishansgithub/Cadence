import {
  addCalendarDays,
  focusMinutesToday,
  partitionToday,
  todayInTimeZone,
  type Task,
} from '@cadence/core'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { buttonClass } from '../../components/ui/buttonClass'
import { ChunkyButton } from '../../components/ui/ChunkyButton'
import { Icon } from '../../components/ui/Icon'
import { Mascot } from '../../components/ui/Mascot'
import { RingButton } from '../../components/ui/RotatingRing'
import { staggerParent } from '../../components/ui/variants'
import { useGoals } from '../../data/use-goals'
import { useTasks, useUpdateTask } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { QuickAdd } from '../tasks/QuickAdd'
import { TaskDrawer } from '../tasks/TaskDrawer'
import { TaskRow } from '../tasks/TaskRow'
import { useTimer } from '../timer/useTimer'
import { DaySummary } from './DaySummary'
import { TodaySkeleton } from './TodaySkeleton'

function greeting(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function SectionTitle({ children, tone, right }: { children: ReactNode; tone: string; right?: ReactNode }) {
  return (
    <div className={`${tone} flex flex-wrap items-center justify-between gap-3`}>
      <h2 className="flex items-center gap-2.5 text-xl font-bold">
        <span aria-hidden className="size-3 rounded-full border-2 border-line bg-tone-slab" />
        {children}
      </h2>
      {right}
    </div>
  )
}

function TaskList({ children }: { children: ReactNode }) {
  return (
    <motion.ul variants={staggerParent} initial="hidden" animate="show" className="mt-3 space-y-2">
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </motion.ul>
  )
}

export function TodayPage() {
  const tasks = useTasks()
  const goals = useGoals()
  const settings = useSettings()
  const timer = useTimer()
  const navigate = useNavigate()
  const updateTask = useUpdateTask()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [doneOpen, setDoneOpen] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)

  const timeZone = settings.settings?.timezone
  const today = timeZone ? todayInTimeZone(timeZone, timer.now) : null
  const groups =
    today && timeZone ? partitionToday(tasks.data ?? [], today, timeZone) : null

  const loading = tasks.isPending || goals.isPending || settings.loading || !settings.settings
  const errored = tasks.isError || goals.isError || settings.error !== null

  async function rescheduleAll() {
    if (!groups || !today) return
    setRescheduling(true)
    const tomorrow = addCalendarDays(today, 1)
    try {
      await Promise.all(
        groups.overdue.map((task) =>
          updateTask.mutateAsync({ id: task.id, input: { due_date: tomorrow } }),
        ),
      )
    } finally {
      setRescheduling(false)
    }
  }

  const plannedTotal = groups
    ? groups.planned.length + groups.doneToday.filter((task) => task.planned_for === today).length
    : 0
  const doneCount = groups?.doneToday.length ?? 0
  const emptyDay = groups && groups.planned.length === 0 && groups.overdue.length === 0 && groups.doneToday.length === 0
  const allDone = groups && groups.planned.length === 0 && groups.overdue.length === 0 && groups.doneToday.length > 0
  const nextTask = groups?.planned.find((task) => task.status === 'in_progress') ?? groups?.planned[0] ?? null
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: timeZone ?? undefined,
  }).format(timer.now)

  const goToTasks = (
    <Link to="/tasks" className={buttonClass('secondary')}>
      Go to Tasks
      <Icon name="arrow-right" size={16} strokeWidth={2.4} />
    </Link>
  )

  return (
    <section>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">{dateLabel}</p>
          <h1 className="mt-1 text-4xl md:text-5xl">Today</h1>
          <p className="mt-1 text-muted">{greeting(timer.now)}. Here&rsquo;s what&rsquo;s on deck.</p>

          <div className="mt-6">
            {today ? (
              <QuickAdd goals={goals.data ?? []} today={today} plannedFor={today} />
            ) : (
              <div className="skeleton h-13 !rounded-full" aria-label="Loading your time zone" />
            )}
          </div>

          {loading && !errored ? (
            <div className="mt-8">
              <TodaySkeleton />
            </div>
          ) : null}

          {errored ? (
            <div
              className="chunky tone-rose chunky-tone mt-8 px-5 py-4 text-sm text-danger"
              role="alert"
            >
              <p>{settings.error ?? (tasks.error instanceof Error ? tasks.error.message : 'Could not load today.')}</p>
              <ChunkyButton
                className="mt-3"
                size="sm"
                onClick={() => {
                  void tasks.refetch()
                  void goals.refetch()
                }}
              >
                Retry
              </ChunkyButton>
            </div>
          ) : null}

          {!loading && !errored && groups && today ? (
            <div className="mt-8 space-y-10">
              <div className="lg:hidden">
                <DaySummary
                  focusMinutes={focusMinutesToday(timer.todaySessions, timer.now)}
                  doneCount={doneCount}
                  plannedCount={plannedTotal}
                />
              </div>

              {emptyDay ? (
                <EmptyState
                  mascot="cat"
                  title="Nothing planned"
                  body="Add a task above, or plan one from Tasks."
                  action={goToTasks}
                />
              ) : null}

              {allDone ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="chunky tone-sage chunky-tone flex items-center gap-4 px-5 py-4"
                >
                  <Mascot name="frog" className="size-14" />
                  <p className="font-display text-lg font-bold">All caught up for today.</p>
                </motion.div>
              ) : null}

              {!emptyDay && (groups.planned.length > 0 || !allDone) ? (
                <section>
                  <SectionTitle
                    tone="tone-peach"
                    right={
                      groups.plannedEstimateMin > 0 ? (
                        <p className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-semibold tabular-nums text-muted">
                          {groups.plannedEstimateMin}m estimated
                        </p>
                      ) : null
                    }
                  >
                    Planned
                  </SectionTitle>
                  {groups.planned.length === 0 ? (
                    <div className="mt-3">
                      <EmptyState
                        mascot="cat"
                        title="Nothing planned"
                        body="Add a task above, or plan one from Tasks."
                        action={goToTasks}
                      />
                    </div>
                  ) : (
                    <TaskList>
                      {groups.planned.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          goals={goals.data ?? []}
                          today={today}
                          onOpen={() => setOpenTask(task)}
                        />
                      ))}
                    </TaskList>
                  )}
                </section>
              ) : null}

              {groups.overdue.length > 0 ? (
                <section>
                  <SectionTitle
                    tone="tone-rose"
                    right={
                      <ChunkyButton
                        size="sm"
                        icon="arrow-right"
                        loading={rescheduling}
                        onClick={() => void rescheduleAll()}
                      >
                        Reschedule all
                      </ChunkyButton>
                    }
                  >
                    <span className="text-overdue">Overdue</span>
                    <span className="font-sans text-sm font-semibold tabular-nums text-muted">
                      ({groups.overdue.length})
                    </span>
                  </SectionTitle>
                  <TaskList>
                    {groups.overdue.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        goals={goals.data ?? []}
                        today={today}
                        onOpen={() => setOpenTask(task)}
                      />
                    ))}
                  </TaskList>
                </section>
              ) : null}

              <section className="tone-sage">
                <button
                  type="button"
                  aria-expanded={doneOpen}
                  onClick={() => setDoneOpen((current) => !current)}
                  className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-full text-left active:!scale-100"
                >
                  <span className="flex items-center gap-2.5 font-display text-xl font-bold">
                    <span aria-hidden className="size-3 rounded-full border-2 border-line bg-tone-slab" />
                    Done
                    <span className="font-sans text-sm font-semibold tabular-nums text-muted">
                      ({groups.doneToday.length})
                    </span>
                  </span>
                  <span className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-muted group-hover:bg-foreground/5 group-hover:text-foreground">
                    {doneOpen ? 'Hide' : 'Show'}
                    <motion.span animate={{ rotate: doneOpen ? 180 : 0 }} className="inline-flex" aria-hidden>
                      <Icon name="chevron-down" size={16} strokeWidth={2.4} />
                    </motion.span>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {doneOpen ? (
                    <motion.div
                      key="done"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
                      className="overflow-hidden px-1 pb-2"
                    >
                      {groups.doneToday.length === 0 ? (
                        <p className="mt-2 text-sm text-muted">Nothing completed today.</p>
                      ) : (
                        <TaskList>
                          {groups.doneToday.map((task) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              goals={goals.data ?? []}
                              today={today}
                              showPlay={false}
                              onOpen={() => setOpenTask(task)}
                            />
                          ))}
                        </TaskList>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </section>
            </div>
          ) : null}
        </div>

        <aside className="hidden space-y-6 lg:block">
          <div className="sticky top-24 space-y-6">
            {!loading && !errored && groups ? (
              <DaySummary
                focusMinutes={focusMinutesToday(timer.todaySessions, timer.now)}
                doneCount={doneCount}
                plannedCount={plannedTotal}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="skeleton h-24" />
                <div className="skeleton h-24" />
              </div>
            )}
            <div className="chunky tone-peach flex flex-col items-center gap-3 px-5 py-6">
              <RingButton
                ringText={timer.active ? 'Open timer' : 'Start session'}
                separator="⏱"
                shape="play"
                label={
                  timer.active
                    ? 'Open the focus timer'
                    : nextTask
                      ? `Start focus on ${nextTask.title}`
                      : 'Start a focus session'
                }
                tone="peach"
                size={190}
                disabled={timer.loading}
                onClick={() => {
                  if (timer.active) void navigate('/focus')
                  else void timer.startFocus(nextTask?.id ?? null)
                }}
              />
              <p className="text-center text-sm text-muted">
                {timer.active ? (
                  'A session is running. Tap to open it.'
                ) : nextTask ? (
                  <>
                    Up next: <span className="font-semibold text-foreground">{nextTask.title}</span>
                  </>
                ) : (
                  'No task picked. Start an open session.'
                )}
              </p>
            </div>
            <div className="chunky tone-sky chunky-tone flex items-center gap-4 p-4">
              <Mascot name="bear" className="size-16 shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">Tip:</span> press <kbd className="rounded border-[1.5px] border-line px-1 text-xs font-semibold">n</kbd> to add a task
                and <kbd className="rounded border-[1.5px] border-line px-1 text-xs font-semibold">space</kbd> to start the timer.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <TaskDrawer task={openTask} goals={goals.data ?? []} onClose={() => setOpenTask(null)} />
    </section>
  )
}
