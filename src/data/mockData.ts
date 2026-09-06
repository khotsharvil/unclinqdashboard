import { Client, ActivityItem } from '../types';
import { ADDITIONAL_PRACTICE_CLIENTS } from './caseloadClients';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'meera-shah',
    name: 'Meera Shah',
    avatarInitials: 'MS',
    preferredPronouns: 'she/her',
    status: 'needs_attention',
    briefingStatus: 'ready',
    nextSession: {
      display: 'Today · 12:30 PM',
      time: '12:30 PM',
      date: '2026-08-27',
      isToday: true,
      dayOfWeek: 'Thursday',
      duration: '50 min',
      isRecurring: true,
      cadence: 'weekly',
      location: 'in_person',
    },
    recurringSchedule: {
      dayOfWeek: 'Thursday',
      time: '12:30 PM',
      duration: '50 min',
      cadence: 'weekly',
      location: 'in_person',
    },
    lastSession: {
      display: '24 Aug',
      date: '2026-08-24',
    },
    needsAttentionReason: {
      summary: 'Since your last session, she mentioned difficulty sleeping on 4 days and tried the breathing exercise twice.',
      worthExploring: 'Whether sleep disruption is connected to the work-related stress she discussed previously.',
    },
    briefing: {
      whatChanged: {
        text: 'Meera reported increased work-related stress this week and mentioned difficulty sleeping on 4 days.',
        mentionsCount: 4,
        journalCount: 3,
        conversationsCount: 2,
        evidenceGroupId: 'ev-meera-sleep-work',
      },
      clientWantsToDiscuss: {
        quote: 'I keep overthinking after work and can’t switch off.',
        context: 'Shared during an evening Emora check-in on August 25 at 11:14 PM.',
        conversationEvidenceId: 'ev-meera-overthinking-quote',
      },
      whatTheyTried: [
        {
          id: 'act-1',
          name: 'Breathing exercise',
          attempted: 3,
          completed: 2,
          clientResponse: 'Helped me calm down before sleeping.',
          status: 'helpful',
        },
        {
          id: 'act-2',
          name: 'Thought reframing',
          attempted: 1,
          completed: 0,
          clientResponse: 'I found it difficult to do when feeling overwhelmed.',
          status: 'difficult',
        },
      ],
      observedPattern: {
        text: 'Work-related stress appears repeatedly alongside difficulty disengaging at night.',
        observedCount: 5,
        lastSeen: 'Aug 26',
        evidenceGroupId: 'ev-meera-pattern-stress-sleep',
        clinicalNoteSeparateFromObservation: 'Observation is grounded in 5 direct logs between Aug 21-26. Clinical exploration: Client may experience late-night anticipatory worry before leadership standups.',
      },
      worthExploring: [
        'Explore whether work-related rumination is contributing to sleep difficulties.',
        'Ask what made the reframing exercise difficult to apply in the moment.',
        'Check if bedtime boundary routines (e.g. laptop shutoff at 9 PM) feel feasible.',
      ],
      context: {
        previousSessionDate: '24 August 2026',
        keyPoints: [
          'Discussed work-related rumination and impending project delivery',
          'Introduced cognitive reframing for catastrophic project deadlines',
          'Agreed to practice diaphragmatic breathing before sleep',
        ],
        previousSessionId: 'session-8-meera',
      },
    },
    journeyPatterns: [
      {
        id: 'pat-1',
        name: 'Work-related rumination',
        firstObserved: 'Aug 05',
        lastObserved: 'Aug 26',
        observedCount: 8,
        supportingMomentsCount: 6,
        evidenceGroupId: 'ev-meera-rumination',
        connectedPatterns: ['Sleep disruption'],
        intervention: {
          name: 'Cognitive reframing',
          introducedDate: 'Aug 12',
          description: 'Identifying catastrophic assumptions regarding project deliverables.',
        },
        applied: {
          attemptsCount: 3,
          details: 'Client attempted 3 times across two weeks; reports forgetting when under acute pressure.',
        },
        clientResponse: '“It helps sometimes, but I forget to use it when I’m actually stressed.”',
        timeline: [
          {
            period: 'Aug 5–11',
            stage: 'pattern_emerged',
            label: 'Pattern emerged',
            description: 'Noted repeated anxiety regarding team reviews and self-perceived shortcomings.',
          },
          {
            period: 'Aug 12–18',
            stage: 'intervention_introduced',
            label: 'Intervention introduced',
            description: 'Introduced 3-column thought record in Session 7.',
          },
          {
            period: 'Aug 19–25',
            stage: 'intervention_attempted',
            label: 'Client attempted intervention',
            description: 'Logged 1 structured reframing attempt in app before Tuesday presentation.',
          },
          {
            period: 'Aug 26–Today',
            stage: 'client_response',
            label: 'Client response',
            description: 'Noted that high evening exhaustion makes reframing feel cognitively heavy.',
          },
        ],
      },
      {
        id: 'pat-2',
        name: 'Sleep disruption',
        firstObserved: 'Aug 09',
        lastObserved: 'Aug 26',
        observedCount: 6,
        supportingMomentsCount: 4,
        evidenceGroupId: 'ev-meera-sleep-work',
        connectedPatterns: ['Work-related rumination'],
        intervention: {
          name: 'Diaphragmatic breathing at bedtime',
          introducedDate: 'Aug 17',
          description: '4-7-8 breathing loop before sleep to reduce physiological arousal.',
        },
        applied: {
          attemptsCount: 4,
          details: 'Attempted 4 nights this past week; completed full 5-minute loop twice.',
        },
        clientResponse: '“Helped me calm down before sleeping, though I still wake up at 4 AM.”',
        timeline: [
          {
            period: 'Aug 9–16',
            stage: 'pattern_emerged',
            label: 'Pattern emerged',
            description: 'Reports taking 90+ minutes to fall asleep on Sunday and Wednesday nights.',
          },
          {
            period: 'Aug 17–23',
            stage: 'intervention_introduced',
            label: 'Intervention introduced',
            description: 'Added guided breathing anchor in Session 7.',
          },
          {
            period: 'Aug 24–26',
            stage: 'intervention_attempted',
            label: 'Client attempted intervention',
            description: 'Used breathing guide on Sunday and Tuesday evenings.',
          },
          {
            period: 'Aug 27',
            stage: 'client_response',
            label: 'Client response',
            description: 'Finds physical grounding helpful; mind still races with next-day tasks.',
          },
        ],
      },
    ],
    therapyJourneys: [
      {
        id: 'journey-meera-1',
        title: 'Sleep & work stress',
        subtitle: 'How your evenings and sleep have changed',
        evidenceGroupId: 'ev-meera-rumination',
        supportingMomentsCount: 22,
        observedPeriod: 'Jun 16 → Aug 27 (11 Weeks)',
        steps: [
          {
            week: 'Week 1',
            phaseTitle: 'Getting started',
            dateRange: 'Jun 16 – Jun 22',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Understanding your sleep and evening stress',
            },
            intervention: {
              name: 'A simple sleep diary',
              introducedDate: 'Jun 16',
              description: 'Noting your bedtime thoughts and how long it took to fall asleep.',
            },
            clientApplication: {
              attemptsCount: 2,
              details: 'Filled in the diary on 2 of 7 nights.',
            },
            clientResponse: {
              verbatimQuote: 'I didn’t realise how often work thoughts hit right at bedtime.',
              summary: 'A first clear look at what was going on.',
            },
            observedChange: {
              from: 'Stress felt vague and out of your control',
              to: 'You could name it and track it',
              summary: 'A clear starting point.',
            },
          },
          {
            week: 'Week 2',
            phaseTitle: 'Making sense of it',
            dateRange: 'Jun 23 – Jun 29',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Seeing how stress keeps you awake',
            },
            intervention: {
              name: 'Learning how it works',
              introducedDate: 'Jun 23',
              description: 'We talked about how worrying at night keeps your body switched on, so sleep won’t come.',
            },
            clientApplication: {
              attemptsCount: 1,
              details: 'Read it over and linked it to busy Wednesday nights.',
            },
            clientResponse: {
              verbatimQuote: 'It helps to know my body is doing something predictable.',
              summary: 'Less blaming yourself, more understanding.',
            },
            observedChange: {
              from: 'Feeling like it was your fault',
              to: 'Seeing it as something you can change',
              summary: 'Less self-blame.',
            },
          },
          {
            week: 'Week 3',
            phaseTitle: 'Spotting the triggers',
            dateRange: 'Jun 30 – Jul 06',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Noticing what sets the worrying off',
            },
            intervention: {
              name: 'Catching the trigger',
              introducedDate: 'Jun 30',
              description: 'Spotting the late work messages and body tension that start the worrying.',
            },
            clientApplication: {
              attemptsCount: 3,
              details: 'Noted what set it off on 3 evenings.',
            },
            clientResponse: {
              verbatimQuote: 'Started noticing the pattern before sleep.',
              summary: 'Catching it after late work messages.',
            },
            observedChange: {
              from: 'The worry just happened on its own',
              to: 'You could catch it starting',
              summary: 'Noticing it sooner.',
            },
          },
          {
            week: 'Week 4',
            phaseTitle: 'Steadier sleep',
            dateRange: 'Jul 07 – Jul 13',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'A steadier sleep routine',
            },
            intervention: {
              name: 'Same wake-up time',
              introducedDate: 'Jul 07',
              description: 'Getting up at 7am, dimming screens after 9:30pm, and less caffeine.',
            },
            clientApplication: {
              attemptsCount: 4,
              details: 'Kept the same wake-up time on 4 of 7 days.',
            },
            clientResponse: {
              verbatimQuote: 'Mornings are a bit easier when I get up at the same time.',
              summary: 'A little less tired in the day.',
            },
            observedChange: {
              from: 'All-over-the-place sleep times',
              to: 'A more regular routine',
              summary: 'Steadier days.',
            },
          },
          {
            week: 'Week 5',
            phaseTitle: 'Writing worries down',
            dateRange: 'Jul 14 – Jul 20',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Getting the worries out of your head',
            },
            intervention: {
              name: 'Writing the thought down',
              introducedDate: 'Jul 14',
              description: 'Putting the worry on paper so you can look at it more calmly.',
            },
            clientApplication: {
              attemptsCount: 2,
              details: 'Wrote worries down twice during the week.',
            },
            clientResponse: {
              verbatimQuote: 'Writing it down makes the worry look smaller.',
              summary: 'A bit more space from the worry.',
            },
            observedChange: {
              from: 'Caught up inside the worry',
              to: 'Looking at the worry from the outside',
              summary: 'A little more distance.',
            },
          },
          {
            week: 'Week 6',
            phaseTitle: 'A calmer way to think',
            dateRange: 'Jul 21 – Jul 27',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Trying a calmer way of thinking',
            },
            intervention: {
              name: 'Swapping the thought',
              introducedDate: 'Jul 21',
              description: 'Practising a more balanced thought before bed.',
            },
            clientApplication: {
              attemptsCount: 5,
              details: 'Tried it 5 times; 3 really helped.',
            },
            clientResponse: {
              verbatimQuote: 'I can catch the thought now, but changing it is still hard at night.',
              summary: 'Can catch the thought; changing it late at night is still tricky.',
            },
            observedChange: {
              from: 'Believing the worst right away',
              to: 'Questioning the worry',
              summary: 'Starting to shift the thinking.',
            },
          },
          {
            week: 'Week 7',
            phaseTitle: 'Calming your body',
            dateRange: 'Jul 28 – Aug 03',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Calming your body at bedtime',
            },
            intervention: {
              name: 'Slow breathing',
              introducedDate: 'Jul 28',
              description: 'A simple slow breathing exercise to relax before sleep.',
            },
            clientApplication: {
              attemptsCount: 6,
              details: 'Practised breathing 6 times; 4 went well.',
            },
            clientResponse: {
              verbatimQuote: 'My body calms faster, even if my mind is still busy.',
              summary: 'Body settles quicker, even when the mind is busy.',
            },
            observedChange: {
              from: 'Wound up at bedtime',
              to: 'Settling more quickly',
              summary: 'A calmer body.',
            },
          },
          {
            week: 'Week 8',
            phaseTitle: 'Switching off work',
            dateRange: 'Aug 04 – Aug 10',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Keeping work out of the evening',
            },
            intervention: {
              name: 'Phone away by 8:30pm',
              introducedDate: 'Aug 04',
              description: 'Putting the laptop and phone away and turning off notifications.',
            },
            clientApplication: {
              attemptsCount: 4,
              details: 'Kept to it on 4 nights.',
            },
            clientResponse: {
              verbatimQuote: 'The nights I put the phone away, I fall asleep sooner.',
              summary: 'Phone away means falling asleep sooner.',
            },
            observedChange: {
              from: 'Checking work late at night',
              to: 'Some evenings kept work-free',
              summary: 'A clearer boundary.',
            },
          },
          {
            week: 'Week 9',
            phaseTitle: 'A time to worry',
            dateRange: 'Aug 11 – Aug 17',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Giving worries their own time',
            },
            intervention: {
              name: 'A set worry time',
              introducedDate: 'Aug 11',
              description: '15 minutes earlier in the evening to worry, so it doesn’t follow you to bed.',
            },
            clientApplication: {
              attemptsCount: 5,
              details: 'Used the worry time on 5 evenings.',
            },
            clientResponse: {
              verbatimQuote: 'Parking it earlier means less of it follows me to bed.',
              summary: 'Less worry left over at bedtime.',
            },
            observedChange: {
              from: 'Worry taking over bedtime',
              to: 'Worry staying earlier in the evening',
              summary: 'Less at bedtime.',
            },
          },
          {
            week: 'Week 10',
            phaseTitle: 'Making it stick',
            dateRange: 'Aug 18 – Aug 24',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Keeping the progress going',
            },
            intervention: {
              name: 'Your own plan',
              introducedDate: 'Aug 18',
              description: 'A simple plan of what to do on tough nights, ready for busy work weeks.',
            },
            clientApplication: {
              attemptsCount: 3,
              details: 'Made the plan and got it ready for a busy week.',
            },
            clientResponse: {
              verbatimQuote: 'I know what to reach for now when a bad night starts.',
              summary: 'Feeling more ready for hard nights.',
            },
            observedChange: {
              from: 'Reacting in the moment',
              to: 'Having a plan ready',
              summary: 'More prepared.',
            },
          },
          {
            week: 'Week 11',
            phaseTitle: 'Where you are now',
            dateRange: 'Aug 25 – Aug 27',
            therapeuticFocus: {
              title: 'Focus',
              detail: 'Calming down and protecting bedtime',
            },
            intervention: {
              name: 'Breathing + phone away',
              introducedDate: 'Aug 25',
              description: 'The slow breathing together with the 8:30pm phone cut-off.',
            },
            clientApplication: {
              attemptsCount: 4,
              details: 'Breathing on 4 nights; phone away on 2.',
            },
            clientResponse: {
              verbatimQuote: 'Helped me calm down before sleeping, though I still wake up at 4 AM.',
              summary: 'Falling asleep is calmer; still waking early.',
            },
            observedChange: {
              from: 'Panicky, wide-awake nights',
              to: 'Noticing it sooner and calming down',
              summary: 'Calmer nights, though early waking still happens.',
            },
          },
        ],
        synthesis: {
          dimensions: [
            {
              label: 'Noticing it earlier',
              trend: 'up',
              statusText: 'Getting better',
              description: 'You spot the work worries earlier in the evening now.',
            },
            {
              label: 'Using the tools',
              trend: 'up',
              statusText: 'Getting there',
              description: 'You’re using the breathing and calmer thinking more often.',
            },
            {
              label: 'The old habit',
              trend: 'stable',
              statusText: 'Still there',
              description: 'Busy, high-pressure work weeks can still bring the night-time worry back.',
            },
          ],
          overallTrajectory: 'Steady progress',
          therapeuticImplication: 'You’re getting better at noticing the worry early and calming your body down. The late-night work stress is still there on tough weeks, but it’s easier to handle than when you started.',
        },
      },
    ],
    sessions: [
      {
        id: 'session-2-meera',
        sessionNumber: 2,
        date: '24 Aug 2026',
        time: '12:30 PM',
        duration: '45 min',
        isInitialSession: false,
        keyThemes: ['Work-related stress', 'Sleep', 'Rumination'],
        summary: 'Meera described increasing difficulty disengaging from work after stressful days. Explored the cognitive loops maintaining nocturnal hyper-arousal and introduced daily cognitive reframing.',
        continuity: {
          builtOn: {
            sessionNumber: 1,
            summary: 'Work stress + rumination',
          },
          ledTo: {
            activityCount: 3,
            description: '3 between-session activities → Session 3',
            nextSessionNumber: 3,
          },
        },
        beforeSnapshot: {
          whatChanged: 'Work stress continued following sprint reviews, especially on Wednesday and Thursday evenings. Meera noticed the urge to check her phone and replay conversations before going to sleep.',
          clientActivity: [
            '3 journal entries reflecting on evening unwinding difficulties',
            '2 breathing exercises (helped with physical tension, but thoughts remained active)',
            '1 note logged after an 11 PM Slack notification',
          ],
          worthExploring: 'How evening work worries and checking notifications affect bedtime wind-down.',
          contextNotes: 'Reported taking over an hour to fall asleep on work nights and feeling tired in the mornings.',
        },
        duringWork: {
          whatDiscussed: 'Explored the client’s tendency to replay work-related thoughts at night. Discussed how late-night notifications trigger worries about team deadlines and falling behind, which keeps her mind active and makes it difficult to fall asleep.',
          discussionPoints: [
            'Noticed a common pattern: receiving an evening message leads to worrying about whether something was missed, leading to checking the phone repeatedly.',
            'Discussed physical signs of stress in the evening, such as jaw tension and restlessness when notifications arrive after work hours.',
            'Talked about the difference between problem-solving during work hours and looping over the same worries late at night.',
          ],
          therapeuticWork: 'Cognitive reframing',
          therapeuticDetails: 'Introduced cognitive reframing to help identify automatic catastrophic thoughts (such as “If I don’t reply immediately, everything will go wrong”) and replace them with more balanced, realistic perspectives. Practiced writing down the worry and testing it against actual facts.',
          clientResponse: '“I understand the thought is probably exaggerated, but changing it is difficult. In the middle of the night it feels completely urgent, but talking it through here makes it clearer.”',
          clientResponseNuance: 'Understands the concept well in session; identified that setting physical distance from the phone in the bedroom will make reframing easier to practice.',
        },
        afterTransition: {
          agreedAction: 'Practice reframing once daily.',
          agreedActionItems: [
            'Practice writing down one reframed thought at the end of the workday when closing the laptop.',
            'Take three slow, deep breaths as a signal that the workday is finished.',
            'Put the work phone on silent after 10:00 PM and place it across the room.',
          ],
          therapistNote: 'Check in next session on whether practicing at the end of the workday felt more manageable than trying to do it right before sleep.',
          exercises: ['Daily thought reframing practice', 'Evening shutdown routine'],
        },
        interventions: ['Cognitive reframing', 'Bedtime wind-down routine'],
        homework: 'Practice reframing automatic thoughts once per day when closing work laptop.',
        therapistObservations: 'Meera was engaged and reflective. She found it helpful to identify the specific thoughts that keep her awake and agreed that small, consistent steps will be more sustainable than trying to change everything at once.',
        transcript: [
          {
            speaker: 'Therapist',
            timestamp: '00:04:12',
            text: 'How did the boundary setting around email after 7 PM feel this week?',
          },
          {
            speaker: 'Client',
            timestamp: '00:04:28',
            text: 'Honestly, I started off trying, but by Wednesday our product VP messaged on Slack and I was glued to my phone until 11:30 PM. I felt like if I didn’t answer immediately, they’d think I’m dropping the ball.',
          },
          {
            speaker: 'Therapist',
            timestamp: '00:05:02',
            text: 'Notice the thought there: “If I don’t answer immediately, they will think I’m dropping the ball.” What emotion comes up with that?',
          },
          {
            speaker: 'Client',
            timestamp: '00:05:18',
            text: 'Pure dread. Like my entire competence is on the line with every notification ping.',
          },
          {
            speaker: 'Therapist',
            timestamp: '00:05:45',
            text: 'Let us look at how we can reframe that automatic assumption when you notice that dread in your chest.',
          },
        ],
      },
      {
        id: 'session-1-meera',
        sessionNumber: 1,
        date: '10 Aug 2026',
        time: '12:30 PM',
        duration: '50 min',
        isInitialSession: true,
        gettingToKnowTitle: 'Getting to know Meera',
        presentingConcerns: ['Work stress', 'Trouble unwinding', 'Difficulty sleeping'],
        background: 'Engineering Team Lead who manages a team of 9 engineers. Promoted 4 months ago and finds it hard to step away from work in the evenings, frequently thinking about upcoming deadlines and project tasks.',
        clientGoals: '“I want to stop thinking about work all the time, turn off my brain at night, and be able to be present during dinner without checking my phone.”',
        initialDirection: 'Explore what triggers evening work worries and establish simple daily routines to unwind after work.',
        keyThemes: ['Getting to know client', 'Work stress', 'Unwinding', 'Sleep routines'],
        summary: 'First session discussing Meera’s work routine, evening stress patterns, and sleep challenges. Explored what triggers her worries after work hours and agreed on simple initial steps to track when stress spikes.',
        continuity: {
          ledTo: {
            activityCount: 3,
            description: '3 between-session activities → Session 2',
            nextSessionNumber: 2,
          },
        },
        interventions: ['Psychoeducation on the stress-arousal cycle', 'Baseline trigger mapping'],
        homework: 'Notice and note the time when work thoughts first resurface after dinner.',
        therapistObservations: 'Strong insight and motivation. High self-imposed standards for team leadership. Open to cognitive and somatic tools.',
        transcript: [
          {
            speaker: 'Therapist',
            timestamp: '00:02:10',
            text: 'Welcome Meera. To start our work together, what brought you to therapy at this point?',
          },
          {
            speaker: 'Client',
            timestamp: '00:02:35',
            text: 'I want to stop thinking about work all the time. By 10 PM I am in bed, but my brain is re-running the entire day’s meetings.',
          },
          {
            speaker: 'Therapist',
            timestamp: '00:03:15',
            text: 'That sounds exhausting. When did you first start noticing this pattern taking over your evenings?',
          },
          {
            speaker: 'Client',
            timestamp: '00:03:30',
            text: 'About four months ago, right after I got promoted to team lead. The responsibility feels constant.',
          },
        ],
      },
    ],
    actions: [
      {
        id: 'act-meera-1',
        title: 'Breathing exercise before sleep',
        assignedDate: 'Aug 17',
        attempts: 3,
        lastAttemptedDate: 'Aug 25',
        clientResponse: '“Helps me calm down before sleeping.”',
        status: 'in_progress',
        frequency: 'Daily before bed',
      },
      {
        id: 'act-meera-2',
        title: 'Thought reframing on work triggers',
        assignedDate: 'Aug 24',
        attempts: 1,
        lastAttemptedDate: 'Aug 25',
        clientResponse: '“Hard to remember when I’m stressed; felt clumsy filling out the prompts.”',
        status: 'needs_discussion',
        frequency: '1x daily on workdays',
      },
      {
        id: 'act-meera-3',
        title: 'Laptop shutoff hard stop at 8:30 PM',
        assignedDate: 'Aug 10',
        attempts: 4,
        lastAttemptedDate: 'Aug 22',
        clientResponse: '“Managed 2 nights, slipped on high-pressure sprint days.”',
        status: 'in_progress',
        frequency: 'Weekdays',
      },
    ],
    notes: [
      {
        id: 'note-1',
        date: '24 Aug 2026',
        title: 'Session 8 impression',
        content: 'Explore relationship between work stress and sleep. Client tends to deflect by talking about team logistics rather than her internal emotional states. Keep returning to somatic sensation and pacing.',
        isPrivate: true,
        category: 'clinical_impression',
      },
      {
        id: 'note-2',
        date: '17 Aug 2026',
        title: 'Supervision reflection',
        content: 'Check for perfectionistic over-functioning as a protective strategy against imposter fears.',
        isPrivate: true,
        category: 'supervision',
      },
    ],
    evidenceStore: {
      'ev-meera-sleep-work': {
        id: 'ev-meera-sleep-work',
        title: 'Sleep disruption & work stress evidence',
        subtitle: '4 mentions · 3 journal entries · 2 conversations',
        items: [
          {
            id: 'ev-item-1',
            date: 'Aug 26 · 11:42 PM',
            source: 'Journal',
            snippet: 'Couldn’t stop thinking about the presentation tomorrow. Turned off the light at 11, still staring at the ceiling at 1:15 AM.',
            context: 'Private journal entry tagged #sleep #work',
          },
          {
            id: 'ev-item-2',
            date: 'Aug 25 · 11:14 PM',
            source: 'Emora',
            snippet: 'My mind keeps running when I get into bed. I keep replaying the conversation with my manager over and over.',
            context: 'Evening AI companion reflection prompt',
          },
          {
            id: 'ev-item-3',
            date: 'Aug 24 · 07:30 AM',
            source: 'Journal',
            snippet: 'Slept really late again. Woke up feeling groggy and anxious before my morning standup.',
            context: 'Morning check-in entry',
          },
          {
            id: 'ev-item-4',
            date: 'Aug 22 · 10:50 PM',
            source: 'Check-in',
            snippet: 'Sleep quality: Low (3/10). Difficulty switching off brain after late Slack messages.',
            context: 'Daily bedtime micro-log',
          },
        ],
      },
      'ev-meera-overthinking-quote': {
        id: 'ev-meera-overthinking-quote',
        title: 'Client discussion item',
        subtitle: 'Conversation snippet from Emora check-in',
        items: [
          {
            id: 'ev-conv-1',
            date: 'Aug 25 · 11:14 PM',
            source: 'Emora',
            snippet: '“I keep overthinking after work and can’t switch off. I want to bring this up with Dr. Vance in our next session because it’s wearing me down.”',
            context: 'Direct client conversation excerpt',
          },
          {
            id: 'ev-conv-2',
            date: 'Aug 25 · 11:16 PM',
            source: 'Emora',
            snippet: '“I try to read a book but my eyes just scan the words while my head is drafting responses to tomorrow’s emails.”',
            context: 'Follow-up reply in companion dialog',
          },
        ],
      },
      'ev-meera-pattern-stress-sleep': {
        id: 'ev-meera-pattern-stress-sleep',
        title: 'Supporting moments for stress & bedtime disengagement',
        subtitle: 'Observed 5 times between Aug 21 – Aug 26',
        items: [
          {
            id: 'ev-pat-1',
            date: 'Aug 26 · 11:42 PM',
            source: 'Journal',
            snippet: 'Presentation anxiety keeping physiological alertness high past midnight.',
          },
          {
            id: 'ev-pat-2',
            date: 'Aug 25 · 11:14 PM',
            source: 'Emora',
            snippet: 'Overthinking loop triggered directly after checking work communications.',
          },
          {
            id: 'ev-pat-3',
            date: 'Aug 23 · 09:15 PM',
            source: 'Voice',
            snippet: '“I feel this knot in my stomach the minute I close my work laptop, like there’s unfinished business waiting to ambush me.”',
          },
          {
            id: 'ev-pat-4',
            date: 'Aug 21 · 11:05 PM',
            source: 'Exercise',
            snippet: 'Breathing exercise abandoned after 2 minutes: “Heart rate still feels fast.”',
          },
        ],
      },
      'ev-meera-rumination': {
        id: 'ev-meera-rumination',
        title: 'Work-related rumination evidence history',
        subtitle: '8 total observations across August',
        items: [
          {
            id: 'ev-rum-1',
            date: 'Aug 26',
            source: 'Journal',
            snippet: 'Worrying about sprint review feedback.',
          },
          {
            id: 'ev-rum-2',
            date: 'Aug 25',
            source: 'Emora',
            snippet: 'Replaying conversations with product VP.',
          },
          {
            id: 'ev-rum-3',
            date: 'Aug 19',
            source: 'Check-in',
            snippet: 'Impending review anxiety rated 8/10.',
          },
          {
            id: 'ev-rum-4',
            date: 'Aug 12',
            source: 'Journal',
            snippet: '“What if they realize I don’t belong in this senior role?”',
          },
        ],
      },
    },
  },
  {
    id: 'aarav-patil',
    name: 'Aarav Patil',
    avatarInitials: 'AP',
    preferredPronouns: 'he/him',
    status: 'active',
    briefingStatus: 'ready',
    nextSession: {
      display: 'Tomorrow · 11:00 AM',
      time: '11:00 AM',
      date: '2026-08-28',
      isToday: false,
      dayOfWeek: 'Friday',
      duration: '50 min',
      isRecurring: true,
      cadence: 'weekly',
      location: 'in_person',
    },
    recurringSchedule: {
      dayOfWeek: 'Friday',
      time: '11:00 AM',
      duration: '50 min',
      cadence: 'weekly',
      location: 'in_person',
    },
    lastSession: {
      display: '25 Aug',
      date: '2026-08-25',
    },
    needsAttentionReason: {
      summary: 'Completed graded exposure exercise for team presentation; reported moderate discomfort (5/10) and positive self-talk.',
      worthExploring: 'Evaluate cognitive shift around speaking up in group meetings.',
    },
    briefing: {
      whatChanged: {
        text: 'Aarav successfully spoke up in two engineering meetings this week without anticipatory panic attacks.',
        mentionsCount: 3,
        journalCount: 2,
        conversationsCount: 1,
        evidenceGroupId: 'ev-aarav-exposure',
      },
      clientWantsToDiscuss: {
        quote: 'I spoke up in the architecture review! It felt uncomfortable at first, but my heart didn’t race like before.',
        context: 'Journal entry logged on August 26 at 4:30 PM.',
        conversationEvidenceId: 'ev-aarav-exposure',
      },
      whatTheyTried: [
        {
          id: 'act-aarav-1',
          name: 'Graded speaking exposure (1 question in meeting)',
          attempted: 2,
          completed: 2,
          clientResponse: 'Felt tense beforehand, but proud afterwards.',
          status: 'helpful',
        },
        {
          id: 'act-aarav-2',
          name: 'Pre-meeting physiological sigh',
          attempted: 3,
          completed: 3,
          clientResponse: 'Lowered baseline heart rate noticeably.',
          status: 'helpful',
        },
      ],
      observedPattern: {
        text: 'Anticipatory dread peaks 15 minutes before meetings but dissipates rapidly once speaking commences.',
        observedCount: 4,
        lastSeen: 'Aug 26',
        evidenceGroupId: 'ev-aarav-exposure',
        clinicalNoteSeparateFromObservation: 'Client demonstrates successful habituation when exposure is engaged directly.',
      },
      worthExploring: [
        'Celebrate the win in the architecture review to reinforce agency.',
        'Explore expanding exposure to volunteering to lead a demo next week.',
        'Review cognitive distortion: "If I pause, people think I am unprepared."',
      ],
      context: {
        previousSessionDate: '25 August 2026',
        keyPoints: [
          'Agreed on hierarchy of social exposures in workplace meetings',
          'Practiced physiological sigh (two inhales, long exhale)',
          'Assigned speaking once in Wednesday review',
        ],
        previousSessionId: 'session-5-aarav',
      },
    },
    journeyPatterns: [
      {
        id: 'pat-aarav-1',
        name: 'Social performance anxiety',
        firstObserved: 'Jul 28',
        lastObserved: 'Aug 26',
        observedCount: 11,
        supportingMomentsCount: 8,
        evidenceGroupId: 'ev-aarav-exposure',
        intervention: {
          name: 'Graded behavioral exposures & physiological sigh',
          introducedDate: 'Aug 11',
          description: 'Stepwise progression from asking one question to presenting roadmap.',
        },
        applied: {
          attemptsCount: 5,
          details: 'Consistently applying breathing before speaking opportunities.',
        },
        clientResponse: '“I still get nervous, but I no longer avoid the meetings.”',
        timeline: [
          {
            period: 'Jul 28–Aug 10',
            stage: 'pattern_emerged',
            label: 'Pattern emerged',
            description: 'Severe avoidance of video calls and team discussions.',
          },
          {
            period: 'Aug 11–18',
            stage: 'intervention_introduced',
            label: 'Intervention introduced',
            description: 'Established 5-tier exposure hierarchy in session.',
          },
          {
            period: 'Aug 19–25',
            stage: 'intervention_attempted',
            label: 'Client attempted intervention',
            description: 'Spoke during Monday standup and Wednesday architecture review.',
          },
          {
            period: 'Aug 26–Today',
            stage: 'client_response',
            label: 'Client response',
            description: 'Reports marked reduction in post-meeting rumination.',
          },
        ],
      },
    ],
    therapyJourneys: [
      {
        id: 'journey-aarav-1',
        title: 'Social Performance Anxiety & Meeting Avoidance',
        subtitle: 'Evolution of behavioral exposure, somatic calming, and communication agency',
        evidenceGroupId: 'ev-aarav-exposure',
        supportingMomentsCount: 8,
        observedPeriod: 'Jul 28 → Aug 26 (4 Weeks)',
        steps: [
          {
            week: 'Week 1',
            phaseTitle: 'Baseline',
            dateRange: 'Jul 28 – Aug 10',
            therapeuticFocus: {
              title: 'Challenge / Baseline',
              detail: 'Severe anticipatory dread & meeting avoidance',
            },
            intervention: {
              name: 'Psychoeducation & exposure hierarchy mapping',
              introducedDate: 'Aug 04',
              description: 'Mapping the avoidance-panic reinforcement cycle and setting a 5-step speaking hierarchy.',
            },
            clientApplication: {
              attemptsCount: 0,
              details: 'Collaboratively graded 5 meeting scenarios by subjective distress (SUDS).',
            },
            clientResponse: {
              verbatimQuote: '“I freeze the second I think about unmuting.”',
              summary: 'Agreed avoidance is maintaining anxiety; hesitant to commit to unscripted questions.',
            },
            observedChange: {
              from: 'Chronic silent meeting avoidance and camera shutoff',
              to: 'Clear awareness of avoidance triggers and shared hierarchy commitment',
              summary: 'From complete avoidance → collaborative hierarchy mapping.',
            },
          },
          {
            week: 'Week 2',
            phaseTitle: 'Somatic grounding',
            dateRange: 'Aug 11 – Aug 18',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Physiological regulation during anticipatory surge',
            },
            intervention: {
              name: 'Pre-meeting physiological sigh & sensory grounding',
              introducedDate: 'Aug 11',
              description: 'Double inhalation with extended sigh 10 minutes prior to joining team video rooms.',
            },
            clientApplication: {
              attemptsCount: 3,
              details: 'Applied breathing protocol before 3 morning standups.',
            },
            clientResponse: {
              verbatimQuote: '“Lowered my baseline heart rate noticeably before calls.”',
              summary: 'Reported distress dropping from 7/10 to 4/10 prior to joining calls.',
            },
            observedChange: {
              from: 'Overwhelming somatic panic spike before calls',
              to: 'Controllable baseline physiological regulation',
              summary: 'From uncontrollable somatic panic → manageable pre-meeting regulation.',
            },
          },
          {
            week: 'Week 3',
            phaseTitle: 'Behavioral execution',
            dateRange: 'Aug 19 – Aug 25',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Graded exposure: Asking 1 question in architecture review',
            },
            intervention: {
              name: 'In-vivo speaking exposure with pre-scripted cue',
              introducedDate: 'Aug 19',
              description: 'Commitment to unmute and ask a clarifying question regarding database schemas.',
            },
            clientApplication: {
              attemptsCount: 2,
              details: 'Executed in Monday standup and Wednesday architecture review.',
            },
            clientResponse: {
              verbatimQuote: '“I spoke up in the architecture review! My heart didn’t race like before.”',
              summary: 'Experienced momentary distress during speaking, followed by high relief and pride.',
            },
            observedChange: {
              from: 'Total verbal inhibition during technical debates',
              to: 'Direct verbal participation with immediate habituation',
              summary: 'From chronic silence → successful behavioral execution with habituation.',
            },
          },
          {
            week: 'Week 4',
            phaseTitle: 'Current integration',
            dateRange: 'Aug 26 – Today',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Cognitive reframing of pauses and unscripted dialogue',
            },
            intervention: {
              name: 'De-catastrophizing conversational pauses',
              introducedDate: 'Aug 25',
              description: 'Reframing: "Taking a pause demonstrates thoughtfulness, not incompetence."',
            },
            clientApplication: {
              attemptsCount: 3,
              details: 'Voluntarily unmuted to offer feedback without prior rehearsal.',
            },
            clientResponse: {
              verbatimQuote: '“I still get nervous, but I no longer avoid the meetings.”',
              summary: 'Marked reduction in post-meeting rumination; voluntary engagement in discussions.',
            },
            observedChange: {
              from: 'Persistent post-meeting self-criticism and isolation',
              to: 'Acceptance of mild nervousness alongside steady engagement',
              summary: 'Avoidance behavior successfully extinguished; communicative agency steadily expanding.',
            },
          },
        ],
        synthesis: {
          dimensions: [
            {
              label: 'Awareness',
              trend: 'up',
              statusText: 'Improving',
              description: 'Accurately identifies anticipatory somatic surge 15 minutes prior to calls.',
            },
            {
              label: 'Skill application',
              trend: 'up',
              statusText: 'Improving',
              description: 'Consistently executes physiological sigh and graded speaking tasks (5 total attempts).',
            },
            {
              label: 'Underlying pattern',
              trend: 'down',
              statusText: 'Attenuating',
              description: 'Avoidance behavior successfully broken; residual anticipatory discomfort.',
            },
          ],
          overallTrajectory: 'Substantial progress',
          therapeuticImplication: 'Behavioral exposure is effectively extinguishing avoidance; shifting focus to unscripted verbal tolerance.',
        },
      },
    ],
    sessions: [
      {
        id: 'session-2-aarav',
        sessionNumber: 2,
        date: '25 Aug 2026',
        time: '11:00 AM',
        duration: '45 min',
        isInitialSession: false,
        keyThemes: ['Performance anxiety', 'Behavioral exposure', 'Somatic regulation'],
        summary: 'Refined exposure hierarchy for team meetings. Addressed fear of blushing and stumbling over words; introduced pre-meeting physiological sigh and in-vivo questioning.',
        continuity: {
          builtOn: {
            sessionNumber: 1,
            summary: 'Social dread & avoidance mapping',
          },
          ledTo: {
            activityCount: 2,
            description: '2 between-session exposure activities → Session 3',
            nextSessionNumber: 3,
          },
        },
        beforeSnapshot: {
          whatChanged: 'Felt nervous before team meetings, but managed to attend without turning off video or skipping speaking turns.',
          clientActivity: [
            '2 breathing exercise logs completed before team standups',
            '1 reflection entry written after Wednesday’s meeting',
          ],
          worthExploring: 'The fear that pauses or hesitations while speaking might make colleagues doubt his technical skills.',
          contextNotes: 'Noticed feeling nervous a few minutes before team calls; found it helpful to take a quick pause beforehand.',
        },
        duringWork: {
          whatDiscussed: 'Explored Aarav’s fear that colleagues will lose confidence in his work if he stumbles over words or takes a pause during meetings. Discussed how preparing overly detailed scripts beforehand adds extra pressure rather than easing anxiety.',
          discussionPoints: [
            'Talked about the worry that asking a clarifying question in front of senior engineers makes him look unprepared.',
            'Identified safety habits: typing out exact sentences in advance and hesitating to unmute spontaneously.',
            'Practiced pausing comfortably for a few seconds before answering without apologizing.',
          ],
          therapeuticWork: 'Speaking practice and confidence building',
          therapeuticDetails: 'Did a quick practice exercise in session: simulated asking a technical question directly without relying on pre-written notes. Practiced taking a calming breath before unmuting.',
          clientResponse: '“I understand that when I say it out loud it sounds like I’m overthinking, but in the moment the nervousness feels very intense. Practicing the pause here makes it feel much more manageable.”',
          clientResponseNuance: 'Engaged well in the practice; noted that small pauses are normal and not noticed by others as much as he assumed.',
        },
        afterTransition: {
          agreedAction: 'Ask 1 clarifying question during the Wednesday architecture review.',
          agreedActionItems: [
            'Take two deep calming breaths 5 minutes before the meeting begins.',
            'Unmute and ask one question naturally without pre-typing a script.',
            'Jot down a quick note afterward about how the conversation went.',
          ],
          therapistNote: 'Continue encouraging spontaneous participation in team meetings.',
          exercises: ['Calming breath before meetings', '1 clarifying question in team review'],
        },
        interventions: ['Graded exposure', 'Physiological sigh'],
        homework: 'Ask 1 question during the Wednesday architecture review.',
        therapistObservations: 'Aarav is intellectually very quick and uses humor to deflect vulnerability. Acknowledged genuine relief when talking about breaking avoidance patterns.',
        transcript: [
          {
            speaker: 'Therapist',
            timestamp: '00:10:15',
            text: 'What is the worst-case scenario if your voice trembles when asking a question?',
          },
          {
            speaker: 'Client',
            timestamp: '00:10:32',
            text: 'I think that they’ll lose confidence in my code. When I say it out loud, it sounds silly, but that’s the immediate fear.',
          },
        ],
      },
      {
        id: 'session-1-aarav',
        sessionNumber: 1,
        date: '11 Aug 2026',
        time: '11:00 AM',
        duration: '50 min',
        isInitialSession: true,
        gettingToKnowTitle: 'Getting to know Aarav',
        presentingConcerns: ['Performance anxiety', 'Meeting avoidance', 'Imposter syndrome'],
        background: 'Senior backend engineer experiencing intense somatic tachycardia and vocal freezing during multi-team design reviews.',
        clientGoals: '“I want to participate in technical debates without having a panic attack.”',
        initialDirection: 'Map avoidance-panic reinforcement cycle and establish graded speaking hierarchy',
        keyThemes: ['Intake', 'Social anxiety', 'Avoidance mapping'],
        summary: 'Intake and diagnostic formulation. Identified avoidance of unmuting as core maintaining factor of social performance anxiety.',
        continuity: {
          ledTo: {
            activityCount: 2,
            description: '2 between-session hierarchy reviews → Session 2',
            nextSessionNumber: 2,
          },
        },
        interventions: ['Psychoeducation on the avoidance cycle', 'SUDS exposure hierarchy construction'],
        homework: 'Rate distress levels across 5 common meeting scenarios.',
        therapistObservations: 'High self-awareness and willingness to engage in behavioral exposure once safety protocols are established.',
        transcript: [
          {
            speaker: 'Therapist',
            timestamp: '00:03:10',
            text: 'Welcome Aarav. What motivated you to reach out for therapy now?',
          },
          {
            speaker: 'Client',
            timestamp: '00:03:40',
            text: 'I keep turning my camera off in meetings. I freeze the second I think about unmuting, and it is starting to affect my career trajectory.',
          },
        ],
      },
    ],
    actions: [
      {
        id: 'act-aarav-task-1',
        title: 'Speak up once in Wednesday architecture review',
        assignedDate: 'Aug 25',
        attempts: 2,
        lastAttemptedDate: 'Aug 26',
        clientResponse: '“Did it! Felt much easier than expected once I actually started talking.”',
        status: 'completed',
        frequency: '1x this week',
      },
    ],
    notes: [
      {
        id: 'note-aarav-1',
        date: '25 Aug 2026',
        title: 'Session 5 clinical note',
        content: 'Client responding very well to behavioral assignments. Next step: encourage impromptu speaking rather than pre-scripting every question.',
        isPrivate: true,
        category: 'clinical_impression',
      },
    ],
    evidenceStore: {
      'ev-aarav-exposure': {
        id: 'ev-aarav-exposure',
        title: 'Meeting exposure log & feedback',
        subtitle: '3 mentions · 2 journal entries',
        items: [
          {
            id: 'ev-a-1',
            date: 'Aug 26 · 04:30 PM',
            source: 'Journal',
            snippet: 'I spoke up in the architecture review! It felt uncomfortable at first, but my heart didn’t race like before. Asked about database indexes.',
            context: 'Post-meeting reflection entry',
          },
          {
            id: 'ev-a-2',
            date: 'Aug 25 · 09:00 AM',
            source: 'Check-in',
            snippet: 'Used 2 physiological sighs before morning sync. Anxiety level dropped from 7 to 4.',
            context: 'Pre-meeting somatic log',
          },
        ],
      },
    },
  },
  {
    id: 'riya-sen',
    name: 'Riya Sen',
    avatarInitials: 'RS',
    preferredPronouns: 'she/her',
    status: 'active',
    briefingStatus: 'no_activity',
    nextSession: {
      display: 'Wednesday · 11:00 AM',
      time: '11:00 AM',
      date: '2026-09-02',
      isToday: false,
      dayOfWeek: 'Wednesday',
      duration: '50 min',
      isRecurring: true,
      cadence: 'weekly',
      location: 'telehealth',
    },
    recurringSchedule: {
      dayOfWeek: 'Wednesday',
      time: '11:00 AM',
      duration: '50 min',
      cadence: 'weekly',
      location: 'telehealth',
    },
    lastSession: {
      display: '20 Aug',
      date: '2026-08-20',
    },
    briefing: {
      whatChanged: {
        text: 'No new journal or chat entries logged since last Thursday’s session.',
        mentionsCount: 0,
        journalCount: 0,
        conversationsCount: 0,
        evidenceGroupId: 'ev-riya-empty',
      },
      clientWantsToDiscuss: {
        quote: 'Follow up on boundary conversation with parents regarding weekend visits.',
        context: 'Established in prior session notes.',
        conversationEvidenceId: 'ev-riya-empty',
      },
      whatTheyTried: [
        {
          id: 'act-riya-1',
          name: 'Drafting boundaries script for family call',
          attempted: 0,
          completed: 0,
          clientResponse: 'No logs recorded.',
          status: 'mixed',
        },
      ],
      observedPattern: {
        text: 'Client tends to disengage from app logging during busy family visit weeks.',
        observedCount: 3,
        lastSeen: 'Aug 20',
        evidenceGroupId: 'ev-riya-empty',
        clinicalNoteSeparateFromObservation: 'Consistent with previous pattern: quiet weeks usually coincide with family conflict avoidance.',
      },
      worthExploring: [
        'Check in warmly about how the family weekend unfolded.',
        'Explore whether non-engagement with homework was due to busy schedule or emotional avoidance.',
      ],
      context: {
        previousSessionDate: '20 August 2026',
        keyPoints: [
          'Explored guilt around saying no to maternal demands',
          'Drafted initial assertive communication script',
        ],
        previousSessionId: 'session-3-riya',
      },
    },
    journeyPatterns: [
      {
        id: 'pat-riya-1',
        name: 'Interpersonal boundary guilt',
        firstObserved: 'Aug 01',
        lastObserved: 'Aug 20',
        observedCount: 5,
        supportingMomentsCount: 3,
        evidenceGroupId: 'ev-riya-empty',
        intervention: {
          name: 'Assertive communication scripts (DEAR MAN)',
          introducedDate: 'Aug 13',
          description: 'Constructing neutral, clear boundary statements.',
        },
        applied: {
          attemptsCount: 1,
          details: 'Practiced roleplay in session; hesitated on phone call.',
        },
        clientResponse: '“I feel so guilty whenever I say I can’t visit.”',
        timeline: [
          {
            period: 'Aug 1–12',
            stage: 'pattern_emerged',
            label: 'Pattern emerged',
            description: 'Frequent reports of exhaustion following weekend family trips.',
          },
          {
            period: 'Aug 13–20',
            stage: 'intervention_introduced',
            label: 'Intervention introduced',
            description: 'DEAR MAN framework introduced in Session 3.',
          },
        ],
      },
    ],
    therapyJourneys: [
      {
        id: 'journey-riya-1',
        title: 'Interpersonal Boundary Guilt & Maternal Enmeshment',
        subtitle: 'Evolution of boundary articulation, guilt tolerance, and self-advocacy',
        evidenceGroupId: 'ev-riya-empty',
        supportingMomentsCount: 4,
        observedPeriod: 'Aug 01 → Aug 27 (4 Weeks)',
        steps: [
          {
            week: 'Week 1',
            phaseTitle: 'Baseline',
            dateRange: 'Aug 01 – Aug 07',
            therapeuticFocus: {
              title: 'Challenge / Baseline',
              detail: 'Automatic compliance → post-visit somatic exhaustion',
            },
            intervention: {
              name: 'Psychoeducation on boundary enmeshment',
              introducedDate: 'Aug 06',
              description: 'Mapping resentment and physical fatigue following obligatory weekend trips.',
            },
            clientApplication: {
              attemptsCount: 0,
              details: 'Logged fatigue score of 8/10 following unplanned family dinner.',
            },
            clientResponse: {
              verbatimQuote: '“Saying no feels like I am committing a crime against my family.”',
              summary: 'Deep guilt prevents verbal limit-setting; somatic symptoms manifest instead.',
            },
            observedChange: {
              from: 'Experiencing chronic resentment without recognizing personal boundary rights',
              to: 'Clear awareness that unexpressed resentment drives subsequent burnout',
              summary: 'From automatic compliance → recognizing guilt-driven enmeshment.',
            },
          },
          {
            week: 'Week 2',
            phaseTitle: 'Building awareness',
            dateRange: 'Aug 08 – Aug 14',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Differentiating compassion from obligatory sacrifice',
            },
            intervention: {
              name: 'Values clarification & guilt normalization',
              introducedDate: 'Aug 13',
              description: 'Separating parental emotional responsibility from self-care boundaries.',
            },
            clientApplication: {
              attemptsCount: 2,
              details: 'Logged internal guilt reflections during 2 telephone conversations.',
            },
            clientResponse: {
              verbatimQuote: '“I recognized the guilt flare-up while on the phone, even though I didn’t push back yet.”',
              summary: 'Noticed somatic constriction in throat when asked to commit to next weekend.',
            },
            observedChange: {
              from: 'Unconscious immediate assent to demands',
              to: 'Pausing and recognizing internal resistance in real time',
              summary: 'From reflex agreement → internal recognition of personal boundary limits.',
            },
          },
          {
            week: 'Week 3',
            phaseTitle: 'Applying the technique',
            dateRange: 'Aug 15 – Aug 21',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Assertive communication script (DEAR MAN)',
            },
            intervention: {
              name: 'Structured 2-sentence boundary statement',
              introducedDate: 'Aug 20',
              description: 'Proposing a bi-weekly visit cadence with warm validation and clear schedule constraints.',
            },
            clientApplication: {
              attemptsCount: 1,
              details: 'Practiced script in session roleplay; deferred sending text over weekend.',
            },
            clientResponse: {
              verbatimQuote: '“I have the script written down. Looking at it makes me nervous, but ready to try.”',
              summary: 'Hesitation remains high; cognitive clarity on desired boundaries is established.',
            },
            observedChange: {
              from: 'Vague boundary hopes without structured words',
              to: 'Concrete written boundary script and validated emotional readiness',
              summary: 'Awareness established; behavioral delivery in active preparation.',
            },
          },
          {
            week: 'Week 4',
            phaseTitle: 'Current integration',
            dateRange: 'Aug 22 – Aug 27',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Delivering boundary & tolerating parental disappointment',
            },
            intervention: {
              name: 'Distress tolerance during post-boundary silence',
              introducedDate: 'Aug 27',
              description: 'Self-soothing techniques while waiting for maternal response.',
            },
            clientApplication: {
              attemptsCount: 1,
              details: 'Scheduled for discussion in today’s session.',
            },
            clientResponse: {
              verbatimQuote: '“I want to send it today with Dr. Vance’s support.”',
              summary: 'Motivation high to execute script with therapist guidance.',
            },
            observedChange: {
              from: 'Helplessness in the face of family demands',
              to: 'Agency and readiness for supported behavioral boundary execution',
              summary: 'Progressing from passive compliance toward supported assertive delivery.',
            },
          },
        ],
        synthesis: {
          dimensions: [
            {
              label: 'Awareness',
              trend: 'up',
              statusText: 'Improving',
              description: 'Distinguishes between genuine parental love and obligatory guilt manipulation.',
            },
            {
              label: 'Skill application',
              trend: 'up',
              statusText: 'Emerging',
              description: 'Formulated concrete DEAR MAN script; practicing roleplay before live delivery.',
            },
            {
              label: 'Underlying pattern',
              trend: 'stable',
              statusText: 'Persistent',
              description: 'Guilt spike remains strong upon contemplating parental disapproval.',
            },
          ],
          overallTrajectory: 'Early foundation',
          therapeuticImplication: 'Therapy is successfully clarifying boundary rights; supported behavioral delivery is the next clinical step.',
        },
      },
    ],
    sessions: [
      {
        id: 'session-2-riya',
        sessionNumber: 2,
        date: '20 Aug 2026',
        time: '4:00 PM',
        duration: '45 min',
        isInitialSession: false,
        keyThemes: ['Family boundaries', 'People pleasing', 'Guilt'],
        summary: 'Explored boundary setting and emotional enmeshment with family. Practiced setting limits around unplanned visits using the DEAR MAN framework.',
        continuity: {
          builtOn: {
            sessionNumber: 1,
            summary: 'Maternal boundary guilt & exhaustion',
          },
          ledTo: {
            activityCount: 2,
            description: '2 between-session script revisions → Session 3',
            nextSessionNumber: 3,
          },
        },
        beforeSnapshot: {
          whatChanged: 'Felt exhausted after an unplanned 5-hour family visit on Sunday; noted needing several days to recover energy.',
          clientActivity: [
            '1 journal entry on difficulty saying no to family requests',
            '1 note on feeling tense when receiving unexpected phone calls',
          ],
          worthExploring: 'The feeling that setting personal boundaries might upset family members.',
          contextNotes: 'Reported feeling overwhelmed balancing weekend chores and extended family visits.',
        },
        duringWork: {
          whatDiscussed: 'Explored Riya’s feeling of guilt when family members ask for impromptu weekend visits. Discussed the pattern of saying yes automatically out of obligation, followed by feeling overwhelmed and drained.',
          discussionPoints: [
            'Discussed the fear of disappointing family members when needing personal rest time.',
            'Looked at the difference between choosing to spend quality time together vs agreeing out of guilt.',
            'Identified practical ways to communicate availability kindly and clearly without over-explaining.',
          ],
          therapeuticWork: 'Boundary communication practice',
          therapeuticDetails: 'Drafted a clear, warm message together in session to propose meeting every two weeks rather than every weekend, allowing for dedicated rest while keeping family connections strong.',
          clientResponse: '“Looking at the message draft makes me a little nervous, but having the exact words planned out takes away the worry of not knowing what to say.”',
          clientResponseNuance: 'Felt relieved having clear phrases ready to use rather than having to respond spontaneously under pressure.',
        },
        afterTransition: {
          agreedAction: 'Draft and send a gentle message proposing the new visit schedule.',
          agreedActionItems: [
            'Review the drafted message once at home.',
            'Send the message to her mother on Thursday morning to agree on Sunday’s plan.',
            'Take a quiet moment afterward to acknowledge taking a positive step for balance.',
          ],
          therapistNote: 'Continue supporting Riya in setting gentle, steady boundaries without feeling guilty.',
          exercises: ['Boundary communication practice', 'Self-care pause after difficult conversations'],
        },
        interventions: ['DEAR MAN technique', 'Values clarification'],
        homework: 'Draft a short text message proposing a bi-weekly visit schedule instead of weekly.',
        therapistObservations: 'High emotional charge when discussing mother’s expectations. Needs slow pacing and validation before pushing for assertive action.',
        transcript: [
          {
            speaker: 'Therapist',
            timestamp: '00:14:00',
            text: 'What feelings arose when you thought about proposing visiting every two weeks instead of every weekend?',
          },
          {
            speaker: 'Client',
            timestamp: '00:14:20',
            text: 'An immediate wave of guilt. Like I am an ungrateful daughter.',
          },
        ],
      },
      {
        id: 'session-1-riya',
        sessionNumber: 1,
        date: '06 Aug 2026',
        time: '4:00 PM',
        duration: '50 min',
        isInitialSession: true,
        gettingToKnowTitle: 'Getting to know Riya',
        presentingConcerns: ['Family enmeshment', 'Chronic guilt', 'Burnout'],
        background: 'Creative producer experiencing severe somatic fatigue and inability to establish interpersonal boundaries with family.',
        clientGoals: '“I want to be able to say no to family demands without feeling sick with guilt.”',
        initialDirection: 'Psychoeducation on boundary enmeshment and separating emotional responsibility from self-care',
        keyThemes: ['Intake', 'Boundary setting', 'Family guilt'],
        summary: 'Intake and baseline exploration. Explored automatic compliance cycle and subsequent somatic exhaustion.',
        continuity: {
          ledTo: {
            activityCount: 2,
            description: '2 between-session reflection logs → Session 2',
            nextSessionNumber: 2,
          },
        },
        interventions: ['Intake formulation', 'Psychoeducation on enmeshment vs healthy connection'],
        homework: 'Log instances where saying yes led to resentment or somatic fatigue.',
        therapistObservations: 'Warm, highly empathetic client with strong self-sacrificing core beliefs.',
        transcript: [
          {
            speaker: 'Therapist',
            timestamp: '00:02:15',
            text: 'Welcome Riya. What brought you to start therapy at this moment?',
          },
          {
            speaker: 'Client',
            timestamp: '00:02:40',
            text: 'Saying no feels like I am committing a crime against my family. I am constantly exhausted from trying to keep everyone happy.',
          },
        ],
      },
    ],
    actions: [
      {
        id: 'act-riya-1',
        title: 'Draft boundaries script for family call',
        assignedDate: 'Aug 20',
        attempts: 0,
        lastAttemptedDate: 'None',
        clientResponse: 'Not yet attempted.',
        status: 'needs_discussion',
        frequency: 'Before Aug 27 session',
      },
    ],
    notes: [
      {
        id: 'note-riya-1',
        date: '20 Aug 2026',
        title: 'Session 3 note',
        content: 'Validate the fear of abandonment before jumping into assertion techniques. The client is worried boundaries equal estrangement.',
        isPrivate: true,
        category: 'clinical_impression',
      },
    ],
    evidenceStore: {
      'ev-riya-empty': {
        id: 'ev-riya-empty',
        title: 'Riya Sen — Activity record',
        subtitle: 'No entries logged this week',
        items: [
          {
            id: 'ev-r-1',
            date: 'Aug 20 · 04:50 PM',
            source: 'Check-in',
            snippet: 'Session 3 concluded. Client noted intention to practice script over the weekend.',
            context: 'Post-session check-out',
          },
        ],
      },
    },
  },
  {
    id: 'david-chen',
    name: 'David Chen',
    avatarInitials: 'DC',
    preferredPronouns: 'he/him',
    status: 'active',
    briefingStatus: 'new_activity',
    nextSession: {
      display: 'Tomorrow · 2:00 PM',
      time: '2:00 PM',
      date: '2026-08-28',
      isToday: false,
      dayOfWeek: 'Friday',
      duration: '50 min',
      isRecurring: true,
      cadence: 'weekly',
      location: 'in_person',
    },
    recurringSchedule: {
      dayOfWeek: 'Friday',
      time: '2:00 PM',
      duration: '50 min',
      cadence: 'weekly',
      location: 'in_person',
    },
    lastSession: {
      display: '21 Aug',
      date: '2026-08-21',
    },
    briefing: {
      whatChanged: {
        text: 'David recorded 2 grief reflections and resumed his morning walks in the botanical garden.',
        mentionsCount: 2,
        journalCount: 2,
        conversationsCount: 1,
        evidenceGroupId: 'ev-david-grief',
      },
      clientWantsToDiscuss: {
        quote: 'I visited our favorite coffee shop on Tuesday. It felt bittersweet, but I didn’t turn around and leave this time.',
        context: 'Voice note recorded Aug 25.',
        conversationEvidenceId: 'ev-david-grief',
      },
      whatTheyTried: [
        {
          id: 'act-david-1',
          name: 'Morning grounding walk (15 mins)',
          attempted: 4,
          completed: 4,
          clientResponse: 'Helped reduce feelings of numbness in the morning.',
          status: 'helpful',
        },
      ],
      observedPattern: {
        text: 'Gradual expansion of life space; willingness to engage with bittersweet memorial triggers.',
        observedCount: 4,
        lastSeen: 'Aug 25',
        evidenceGroupId: 'ev-david-grief',
        clinicalNoteSeparateFromObservation: 'Dual-Process Model of Grief: Client is moving smoothly between loss-orientation and restoration-orientation.',
      },
      worthExploring: [
        'Explore the coffee shop experience and emotional after-effects.',
        'Acknowledge resilience while making space for spontaneous waves of grief.',
      ],
      context: {
        previousSessionDate: '21 August 2026',
        keyPoints: [
          'Discussed coping with anniversaries and sudden waves of grief',
          'Agreed on gentle behavioral activation with outdoor walks',
        ],
        previousSessionId: 'session-6-david',
      },
    },
    journeyPatterns: [
      {
        id: 'pat-david-1',
        name: 'Grief oscillation and avoidance',
        firstObserved: 'Jul 15',
        lastObserved: 'Aug 25',
        observedCount: 9,
        supportingMomentsCount: 5,
        evidenceGroupId: 'ev-david-grief',
        intervention: {
          name: 'Dual Process Model & Behavioral Activation',
          introducedDate: 'Jul 29',
          description: 'Balancing grief processing with restoration activities.',
        },
        applied: {
          attemptsCount: 6,
          details: 'Walks completed 4 times this past week.',
        },
        clientResponse: '“Doing things outside keeps me from getting stuck in dark rumination.”',
        timeline: [
          {
            period: 'Jul 15–28',
            stage: 'pattern_emerged',
            label: 'Pattern emerged',
            description: 'Severe isolation and reluctance to leave home.',
          },
          {
            period: 'Jul 29–Aug 15',
            stage: 'intervention_introduced',
            label: 'Intervention introduced',
            description: 'Established micro-walks and compassionate journaling.',
          },
          {
            period: 'Aug 16–25',
            stage: 'intervention_attempted',
            label: 'Client attempted intervention',
            description: 'Visited shared meaningful spaces with increased tolerance.',
          },
        ],
      },
    ],
    therapyJourneys: [
      {
        id: 'journey-david-1',
        title: 'Grief Oscillation & Life Space Expansion',
        subtitle: 'Evolution of bereavement coping, restoration activities, and emotional tolerance',
        evidenceGroupId: 'ev-david-grief',
        supportingMomentsCount: 5,
        observedPeriod: 'Jul 15 → Aug 25 (6 Weeks)',
        steps: [
          {
            week: 'Week 1',
            phaseTitle: 'Baseline',
            dateRange: 'Jul 15 – Jul 28',
            therapeuticFocus: {
              title: 'Challenge / Baseline',
              detail: 'Acute grief paralysis & domestic withdrawal',
            },
            intervention: {
              name: 'Dual Process Model psychoeducation',
              introducedDate: 'Jul 22',
              description: 'Normalizing oscillation between loss-orientation and restoration-orientation.',
            },
            clientApplication: {
              attemptsCount: 1,
              details: 'Logged 1 reflective grief journal entry.',
            },
            clientResponse: {
              verbatimQuote: '“Leaving the house feels like betraying the memory of what we had.”',
              summary: 'Intense guilt whenever feeling momentary positive affect or stepping outdoors.',
            },
            observedChange: {
              from: 'Experiencing grief as total shutdown and isolation',
              to: 'Initial cognitive reframing of self-care as honorific rather than betraying',
              summary: 'From acute isolation → cognitive normalization of grief oscillation.',
            },
          },
          {
            week: 'Week 2',
            phaseTitle: 'Building awareness',
            dateRange: 'Jul 29 – Aug 11',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Micro-behavioral restoration activation',
            },
            intervention: {
              name: '10-minute morning grounding walks',
              introducedDate: 'Jul 29',
              description: 'Gentle somatic outdoor grounding without forced positive thinking.',
            },
            clientApplication: {
              attemptsCount: 3,
              details: 'Walked in the botanical garden 3 mornings.',
            },
            clientResponse: {
              verbatimQuote: '“Heavy at first, but once I felt the breeze, it gave me a sense of room to breathe.”',
              summary: 'Noticed reduction in morning numbness and mental fog.',
            },
            observedChange: {
              from: 'Complete immobility in morning hours',
              to: 'Willingness to initiate sensory outdoor grounding',
              summary: 'From morning immobility → consistent behavioral stepping stone.',
            },
          },
          {
            week: 'Week 3',
            phaseTitle: 'Applying the technique',
            dateRange: 'Aug 12 – Aug 18',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Compassionate self-talk during grief triggers',
            },
            intervention: {
              name: 'Grief container & compassionate self-dialogue',
              introducedDate: 'Aug 12',
              description: 'Allowing grief waves to wash through without catastrophic judgment.',
            },
            clientApplication: {
              attemptsCount: 4,
              details: 'Applied during 2 anniversary dates and unexpected song triggers.',
            },
            clientResponse: {
              verbatimQuote: '“I let myself cry for twenty minutes and didn’t feel broken afterwards.”',
              summary: 'Decreased post-grief self-reproach; faster emotional equilibrium recovery.',
            },
            observedChange: {
              from: 'Fear of being permanently destroyed by grief waves',
              to: 'Emotional tolerance and self-compassion during acute grief surges',
              summary: 'Emotional tolerance established; grief waves no longer trigger days of paralysis.',
            },
          },
          {
            week: 'Week 4',
            phaseTitle: 'Current integration',
            dateRange: 'Aug 19 – Aug 25',
            therapeuticFocus: {
              title: 'Therapeutic focus',
              detail: 'Re-entering shared meaningful community spaces',
            },
            intervention: {
              name: 'Graduated re-entry to shared social spaces',
              introducedDate: 'Aug 19',
              description: 'Visiting favorite neighborhood café with permission to stay or depart at will.',
            },
            clientApplication: {
              attemptsCount: 4,
              details: 'Visited café on Tuesday and Saturday; stayed for 25 minutes.',
            },
            clientResponse: {
              verbatimQuote: '“I visited our favorite coffee shop on Tuesday. It felt bittersweet, but I didn’t turn around and leave.”',
              summary: 'Held bittersweet emotions simultaneously with presence and connection.',
            },
            observedChange: {
              from: 'Total avoidance of memorial environments',
              to: 'Meaningful reintegration into community life with integrated grief',
              summary: 'From avoidance of memorial triggers → capacity to hold bittersweet connection and forward movement.',
            },
          },
        ],
        synthesis: {
          dimensions: [
            {
              label: 'Awareness',
              trend: 'up',
              statusText: 'Improving',
              description: 'Recognizes grief triggers in advance and anticipates emotional waves with self-compassion.',
            },
            {
              label: 'Skill application',
              trend: 'up',
              statusText: 'Improving',
              description: 'Consistently applies morning walks (4/4 completed this week) and compassionate self-dialogue.',
            },
            {
              label: 'Underlying pattern',
              trend: 'down',
              statusText: 'Attenuating',
              description: 'Paralyzing avoidance behavior shifting into integrated, tolerable bittersweet commemoration.',
            },
          ],
          overallTrajectory: 'Consistent coping integration',
          therapeuticImplication: 'Therapy is successfully supporting the Dual Process Model; client is expanding life space while honoring bereavement.',
        },
      },
    ],
    sessions: [
      {
        id: 'session-2-david',
        sessionNumber: 2,
        date: '21 Aug 2026',
        time: '2:00 PM',
        duration: '45 min',
        isInitialSession: false,
        keyThemes: ['Bereavement', 'Behavioral activation', 'Meaning reconstruction'],
        summary: 'Explored grief triggers around upcoming milestones and anniversary dates. Introduced the Dual Process Model and morning outdoor sensory activation.',
        continuity: {
          builtOn: {
            sessionNumber: 1,
            summary: 'Grief paralysis & domestic withdrawal',
          },
          ledTo: {
            activityCount: 3,
            description: '3 between-session morning walks → Session 3',
            nextSessionNumber: 3,
          },
        },
        beforeSnapshot: {
          whatChanged: 'Experienced waves of sadness over the anniversary weekend, but managed to take two gentle morning walks in the park.',
          clientActivity: [
            '2 outdoor morning walk logs',
            '1 journal entry reflecting on fond memories of his partner',
          ],
          worthExploring: 'The feeling of guilt when experiencing moments of ease or enjoying everyday activities.',
          contextNotes: 'Reported that taking slow walks in the morning sunlight provided a gentle sense of routine.',
        },
        duringWork: {
          whatDiscussed: 'Explored David’s feeling that enjoying everyday activities or feeling moments of joy might feel like forgetting his late partner. Discussed how holding grief and re-engaging with daily life can happen together naturally.',
          discussionPoints: [
            'Talked about the guilt that arises when laughing or enjoying a meal with friends.',
            'Discussed how taking care of oneself and enjoying daily moments is a way to honor his partner’s memory.',
            'Practiced simple, kind self-reminders to use when self-critical thoughts appear.',
          ],
          therapeuticWork: 'Grief processing & supportive self-dialogue',
          therapeuticDetails: 'Talked through the natural rhythm of grief: allowing space for sadness while also giving permission to engage in refreshing daily routines like gardening and morning walks.',
          clientResponse: '“I sat on the park bench, let myself feel sad without trying to push it away, and realized that sitting in the sun felt comforting. Walking back home felt lighter.”',
          clientResponseNuance: 'Appeared noticeably more relaxed toward the end of the session; felt encouraged by the idea that grief and gentle joy can coexist.',
        },
        afterTransition: {
          agreedAction: 'Continue morning outdoor walks and practice gentle self-reminders.',
          agreedActionItems: [
            'Take three 15-minute gentle morning walks when the sun is out.',
            'When feeling guilty during a pleasant moment, remind himself: “It is okay to enjoy this moment while still honoring my memories.”',
            'Write down one fond memory in his journal when he feels inspired.',
          ],
          therapistNote: 'Continue supporting David in balancing quiet reflection with nourishing daily activities.',
          exercises: ['Morning walk (3x)', 'Supportive self-reminder'],
        },
        interventions: ['Dual process model', 'Compassionate self-talk'],
        homework: 'Take two 15-minute walks in the morning when sunlight is out.',
        therapistObservations: 'Affect was brighter toward the end of session. Demonstrates growing capacity to hold both grief and forward movement.',
        transcript: [
          {
            speaker: 'Therapist',
            timestamp: '00:12:00',
            text: 'How did it feel to step outside when the heaviness was present?',
          },
          {
            speaker: 'Client',
            timestamp: '00:12:20',
            text: 'Heavy at first, but once I felt the breeze, it gave me a sense of room to breathe.',
          },
        ],
      },
      {
        id: 'session-1-david',
        sessionNumber: 1,
        date: '07 Aug 2026',
        time: '2:00 PM',
        duration: '50 min',
        isInitialSession: true,
        gettingToKnowTitle: 'Getting to know David',
        presentingConcerns: ['Acute bereavement', 'Social isolation', 'Loss of purpose'],
        background: 'Retired architect grieving the sudden loss of spouse of 32 years, experiencing domestic paralysis and emotional shutdown.',
        clientGoals: '“I want to find a way to keep living without feeling like I am forgetting her.”',
        initialDirection: 'Psychoeducation on grief oscillation (loss vs restoration orientation) and gentle micro-behavioral stepping stones',
        keyThemes: ['Intake', 'Grief counseling', 'Restoration orientation'],
        summary: 'Intake and compassionate assessment. Explored severe domestic isolation and guilt associated with leaving the house.',
        continuity: {
          ledTo: {
            activityCount: 2,
            description: '2 between-session reflective entries → Session 2',
            nextSessionNumber: 2,
          },
        },
        interventions: ['Intake assessment', 'Validation of grief waves & Dual Process orientation'],
        homework: 'Open blinds in living room each morning and sit near natural light for 5 minutes.',
        therapistObservations: 'Deeply loving, reflective client struggling with profound absence. Strong therapeutic alliance established.',
        transcript: [
          {
            speaker: 'Therapist',
            timestamp: '00:03:00',
            text: 'Welcome David. I know taking this step to come in today took immense courage.',
          },
          {
            speaker: 'Client',
            timestamp: '00:03:30',
            text: 'Leaving the house feels like betraying the memory of what we had. But sitting alone in the silence is slowly destroying me.',
          },
        ],
      },
    ],
    actions: [
      {
        id: 'act-david-task-1',
        title: 'Morning grounding walk (15 mins)',
        assignedDate: 'Aug 21',
        attempts: 4,
        lastAttemptedDate: 'Aug 25',
        clientResponse: '“Helped reduce feelings of morning numbness.”',
        status: 'in_progress',
        frequency: '3-4x weekly',
      },
    ],
    notes: [
      {
        id: 'note-david-1',
        date: '21 Aug 2026',
        title: 'Session 6 note',
        content: 'David is making meaningful progress. Reinforce that having good days does not diminish love or loyalty to the deceased.',
        isPrivate: true,
        category: 'clinical_impression',
      },
    ],
    evidenceStore: {
      'ev-david-grief': {
        id: 'ev-david-grief',
        title: 'David Chen — Grief journal & voice reflections',
        subtitle: '2 journal entries · 1 voice reflection',
        items: [
          {
            id: 'ev-d-1',
            date: 'Aug 25 · 10:15 AM',
            source: 'Voice',
            snippet: '“I visited our favorite coffee shop on Tuesday. It felt bittersweet, but I didn’t turn around and leave this time. I sat down and drank my latte.”',
            context: 'Post-walk voice recording',
          },
          {
            id: 'ev-d-2',
            date: 'Aug 23 · 08:30 AM',
            source: 'Journal',
            snippet: 'Morning walk in the botanical garden. The air was crisp. I felt a quiet sense of peace for about twenty minutes.',
            context: 'Morning reflection',
          },
        ],
      },
    },
  },
  ...ADDITIONAL_PRACTICE_CLIENTS,
];

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    clientId: 'aarav-patil',
    clientName: 'Aarav',
    action: 'Session summary generated',
    timeAgo: '10m ago',
    type: 'summary',
  },
  {
    id: 'act-2',
    clientId: 'meera-shah',
    clientName: 'Meera',
    action: 'Completed action: Breathing exercise',
    timeAgo: '1h ago',
    type: 'action',
  },
  {
    id: 'act-3',
    clientId: 'riya-sen',
    clientName: 'Riya',
    action: 'Added a journal entry',
    timeAgo: '3h ago',
    type: 'journal',
  },
  {
    id: 'act-4',
    clientId: 'david-chen',
    clientName: 'David',
    action: 'Logged voice reflection',
    timeAgo: 'Yesterday',
    type: 'checkin',
  },
];
