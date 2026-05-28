function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatModeLabel(mode = 'chat') {
  const label = {
    chat: '规划',
    design: '设计',
    dev: '开发',
    game: '预览',
    task: '任务',
  }[mode]
  if (label) return label
  if (String(mode).startsWith('pw-')) return '工作台'
  return '规划'
}

function normalizeWorkspaceMap(workspaceEntries = []) {
  const map = new Map()
  workspaceEntries.forEach((entry) => {
    if (!entry?.userId) return
    map.set(entry.userId, entry)
  })
  return map
}

function normalizeVisibleWindows(visibleWindowsByUser = {}) {
  if (visibleWindowsByUser instanceof Map) return visibleWindowsByUser
  return new Map(Object.entries(visibleWindowsByUser || {}))
}

function normalizeParticipant(participant, localUserId) {
  if (!participant) {
    return {
      id: '',
      name: '协作者',
      online: false,
      isMe: false,
    }
  }
  if (typeof participant === 'string') {
    return {
      id: participant,
      name: participant,
      online: false,
      isMe: participant === localUserId,
    }
  }
  return {
    id: participant.id || '',
    name: participant.name || participant.id || '协作者',
    online: participant.online !== false,
    isMe: participant.id === localUserId,
  }
}

function buildMemberCards({ users, workspaceMap, visibleWindowsMap, sharedSessions, localUserId, activeMode }) {
  const sessionCounts = new Map()
  sharedSessions.forEach((session) => {
    ;(session.participants || []).forEach((participant) => {
      const participantId = typeof participant === 'string' ? participant : participant?.id
      if (!participantId) return
      sessionCounts.set(participantId, (sessionCounts.get(participantId) || 0) + 1)
    })
  })

  return users
    .map((user) => {
      const workspaceEntry = workspaceMap.get(user.id) || null
      const visibleWindows = Array.isArray(visibleWindowsMap.get(user.id)) ? visibleWindowsMap.get(user.id) : []
      const contextLabel = workspaceEntry?.catLabel && workspaceEntry?.taskLabel
        ? `${workspaceEntry.catLabel} · ${workspaceEntry.taskLabel}`
        : workspaceEntry?.taskLabel || workspaceEntry?.catLabel || formatModeLabel(user.mode)

      return {
        id: user.id || '',
        name: user.name || '协作者',
        avatarLabel: (user.name || '协作者').slice(0, 1).toUpperCase(),
        avatarUrl: user.avatarUrl || '',
        colorIndex: Number(user.color) || 0,
        isMe: user.id === localUserId,
        isActive: user.mode === activeMode,
        online: user.online !== false,
        modeLabel: formatModeLabel(user.mode),
        contextLabel,
        windowCount: visibleWindows.length,
        focusWindowLabel: visibleWindows[0]?.name || '暂无窗口',
        windows: visibleWindows.map((windowEntry) => ({
          id: windowEntry.id || '',
          name: windowEntry.name || windowEntry.id || '窗口',
        })),
        sharedCount: sessionCounts.get(user.id) || 0,
      }
    })
    .sort((left, right) => {
      if (left.isMe !== right.isMe) return left.isMe ? -1 : 1
      if (left.isActive !== right.isActive) return left.isActive ? -1 : 1
      return String(left.name).localeCompare(String(right.name), 'zh-Hans-CN')
    })
}

function buildSharedSessionCards(sharedSessions = [], localUserId = '') {
  return sharedSessions
    .filter((session) => session && (session.winName || session.winType) && Array.isArray(session.participants) && session.participants.length > 0)
    .map((session) => {
      const participants = session.participants.map((participant) => normalizeParticipant(participant, localUserId))
      const onlineCount = participants.filter((participant) => participant.online).length
      const localJoined = participants.some((participant) => participant.id === localUserId)

      return {
        id: session.id || '',
        sourceInstanceId: session.sourceInstanceId || session.winId || '',
        windowLabel: session.winName || session.winType || '共享窗口',
        ownerName: session.owner?.name || '协作者',
        participants,
        participantSummary: participants.map((participant) => participant.name).join('、'),
        onlineCount,
        localJoined,
        actionLabel: localJoined ? '打开共享窗口' : '加入并打开',
      }
    })
    .sort((left, right) => String(left.windowLabel).localeCompare(String(right.windowLabel), 'zh-Hans-CN'))
}

export function buildTeamDashboardModel({
  users = [],
  workspaceEntries = [],
  visibleWindowsByUser = {},
  sharedSessions = [],
  localUserId = '',
  activeMode = '',
} = {}) {
  const onlineUsers = (Array.isArray(users) ? users : []).filter((user) => user && user.id)
  const workspaceMap = normalizeWorkspaceMap(workspaceEntries)
  const visibleWindowsMap = normalizeVisibleWindows(visibleWindowsByUser)
  const sessions = buildSharedSessionCards(Array.isArray(sharedSessions) ? sharedSessions : [], localUserId)
  const members = buildMemberCards({
    users: onlineUsers,
    workspaceMap,
    visibleWindowsMap,
    sharedSessions: sessions,
    localUserId,
    activeMode,
  })

  return {
    summary: {
      onlineCount: members.length,
      sharedCount: sessions.length,
    },
    members,
    sessions,
  }
}

function renderMemberCards(members = []) {
  if (!members.length) {
    return `
      <div class="team-dashboard__empty">
        <div class="team-dashboard__empty-title">还没有在线协作者</div>
        <div class="team-dashboard__empty-copy">成员上线后，这里会实时显示他们的工作状态。</div>
      </div>
    `
  }

  return members
    .map(
      (member) => `
        <button class="team-dashboard__member-card${member.isActive ? ' is-active' : ''}" type="button" data-team-user-id="${escapeHtml(member.id)}">
          <div class="team-dashboard__member-head">
            <div class="team-dashboard__member-avatar"${member.avatarUrl ? ` style="background-image:url('${escapeHtml(member.avatarUrl)}')"` : ''}>${member.avatarUrl ? '' : escapeHtml(member.avatarLabel)}</div>
            <div class="team-dashboard__member-copy">
              <div class="team-dashboard__member-name">${escapeHtml(member.name)}${member.isMe ? ' <span class="team-dashboard__member-me">(我)</span>' : ''}</div>
              <div class="team-dashboard__member-meta">${escapeHtml(member.modeLabel)} · ${escapeHtml(member.contextLabel)}</div>
            </div>
            <span class="team-dashboard__status-dot${member.online ? ' is-online' : ''}"></span>
          </div>
          <div class="team-dashboard__member-stats">
            <span>${escapeHtml(member.windowCount)} 个窗口</span>
            <span>${escapeHtml(member.sharedCount)} 个共享</span>
          </div>
          <div class="team-dashboard__member-focus">当前窗口 · ${escapeHtml(member.focusWindowLabel)}</div>
          <div class="team-dashboard__member-window-list">
            ${member.windows.map((windowEntry) => `<span class="team-dashboard__window-pill">${escapeHtml(windowEntry.name)}</span>`).join('')}
          </div>
        </button>
      `,
    )
    .join('')
}

function renderSessionCards(sessions = []) {
  if (!sessions.length) {
    return `
      <div class="team-dashboard__empty">
        <div class="team-dashboard__empty-title">还没有共享窗口</div>
        <div class="team-dashboard__empty-copy">有人发起窗口共享后，这里会出现实时协作会话。</div>
      </div>
    `
  }

  return sessions
    .map(
      (session) => `
        <button class="team-dashboard__session-card" type="button" data-session-id="${escapeHtml(session.id)}">
          <div class="team-dashboard__session-head">
            <div>
              <div class="team-dashboard__session-title">${escapeHtml(session.windowLabel)}</div>
              <div class="team-dashboard__session-meta">发起人 · ${escapeHtml(session.ownerName)}</div>
            </div>
            <span class="team-dashboard__session-count">${escapeHtml(session.onlineCount)} 在线</span>
          </div>
          <div class="team-dashboard__session-participants">${escapeHtml(session.participantSummary)}</div>
          <div class="team-dashboard__session-action">${escapeHtml(session.actionLabel)}</div>
        </button>
      `,
    )
    .join('')
}

export function renderTeamDashboard(container, model = buildTeamDashboardModel()) {
  if (!container) return

  container.innerHTML = `
    <section class="team-dashboard">
      <header class="team-dashboard__header">
        <div>
          <div class="team-dashboard__eyebrow">TEAM DASHBOARD</div>
          <div class="team-dashboard__title">团队仪表盘</div>
        </div>
        <div class="team-dashboard__summary">
          <span>${escapeHtml(model.summary.onlineCount)} 人在线</span>
          <span>${escapeHtml(model.summary.sharedCount)} 个共享</span>
        </div>
      </header>
      <section class="team-dashboard__section">
        <div class="team-dashboard__section-head">
          <strong>在线成员</strong>
          <span>实时工作状态</span>
        </div>
        <div class="team-dashboard__member-grid">
          ${renderMemberCards(model.members)}
        </div>
      </section>
      <section class="team-dashboard__section">
        <div class="team-dashboard__section-head">
          <strong>共享窗口</strong>
          <span>当前协作会话</span>
        </div>
        <div class="team-dashboard__session-list">
          ${renderSessionCards(model.sessions)}
        </div>
      </section>
    </section>
  `
}
