const sessions = {};

// Funktion til at oprette en session
function createSession(sessionId, taskList) {
  const existingTeams = sessions[sessionId]?.teams || {};

  sessions[sessionId] = {
    tasks: taskList,
    teams: existingTeams,
    taskQueues: {},
  };
}

// Funktion til at tilslutte et team til en session
function joinTeam(sessionId, teamName, socketId) {
  if (!sessions[sessionId])
    sessions[sessionId] = { tasks: [], teams: {}, taskQueues: {} };

  const session = sessions[sessionId];

  if (session.teams[teamName]) return false;

  session.teams[teamName] = { socketId };
  return true;
}

// Funktion til at tildele en randomiseret opgavekø til et team
function assignTaskQueue(sessionId, teamName, taskList) {
  const shuffled = [...taskList].sort(() => Math.random() - 0.5);
  const firstTask = shuffled[0];
  const duration = (firstTask.Tid || 5) * 60;

  sessions[sessionId].taskQueues[teamName] = {
    queue: shuffled,
    index: 0,
    startTime: Date.now(),
    duration: duration,
  };

  return firstTask;
}

// Funktion til at tildele den næste opgave til et team
function getNextTask(sessionId, teamName) {
  const queueData = sessions[sessionId]?.taskQueues[teamName];
  if (!queueData) return null;

  queueData.index++;
  const nextTask = queueData.queue[queueData.index];

  if (nextTask) {
    queueData.startTime = Date.now();
    queueData.duration = (nextTask.Tid || 5) * 60;
  }

  return nextTask || null;
}

// Funktion til slette session når spillet er færdigt
function removeSession(sessionId) {
  delete sessions[sessionId];
}

// Funktion til at hente alle sessioner
function getAllSessions() {
  return sessions;
}

// Funktion til at overvåge session
function getSession(sessionId) {
  return sessions[sessionId];
}

module.exports = {
  createSession,
  joinTeam,
  assignTaskQueue,
  getNextTask,
  getAllSessions,
  getSession,
  removeSession,
};
