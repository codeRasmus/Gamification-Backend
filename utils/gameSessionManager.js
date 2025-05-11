const sessions = {}; // intern hukommelse

function createSession(sessionId, taskList) {
    const existingTeams = sessions[sessionId]?.teams || {};

    sessions[sessionId] = {
        tasks: taskList,
        teams: existingTeams, // ✅ behold tilsluttede hold
        taskQueues: {},
    };
}

function joinTeam(sessionId, teamName, socketId) {
    if (!sessions[sessionId]) sessions[sessionId] = { tasks: [], teams: {}, taskQueues: {} };

    const session = sessions[sessionId];

    if (session.teams[teamName]) return false;

    session.teams[teamName] = { socketId };
    return true;
}

function assignTaskQueue(sessionId, teamName, taskList) {
    const shuffled = [...taskList].sort(() => Math.random() - 0.5);
    const firstTask = shuffled[0];
    const duration = (firstTask.Tid || 5) * 60;

    sessions[sessionId].taskQueues[teamName] = {
        queue: shuffled,
        index: 0,
        startTime: Date.now(),
        duration: duration
    };

    return firstTask;
}


function getNextTask(sessionId, teamName) {
    const queueData = sessions[sessionId]?.taskQueues[teamName];
    if (!queueData) return null;

    queueData.index++;
    const nextTask = queueData.queue[queueData.index];

    if (nextTask) {
        queueData.startTime = Date.now();
        queueData.duration = (nextTask.Tid || 5) * 60;
    }

    console.log(`➡️  Næste opgave til ${teamName}:`, nextTask?.Spørgsmål || "Ingen flere");

    return nextTask || null;
}


function getAllSessions() {
    return sessions;
}

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
};
