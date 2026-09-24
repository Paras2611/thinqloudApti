function setupSocket(io) {
  io.on('connection', (socket) => {
    // Session join event for room subscription
    socket.on('join_session_room', ({ session_id, role, candidate_name }) => {
      socket.join(`session_${session_id}`);
      if (role === 'CANDIDATE') {
        io.to(`session_${session_id}`).emit('live_event', {
          type: 'candidate_active',
          session_id,
          candidate_name: candidate_name || 'Candidate',
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('leave_session_room', ({ session_id }) => {
      socket.leave(`session_${session_id}`);
    });

    socket.on('candidate_tab_switch', ({ session_id, candidate_name, switch_count }) => {
      io.to(`session_${session_id}`).emit('live_event', {
        type: 'tab_switch_alert',
        session_id,
        candidate_name,
        switch_count,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}

module.exports = { setupSocket };
