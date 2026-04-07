// Date utility functions for contest formatting

export const formatContestDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const options = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    timeZoneName: 'short',
    hour12: false
  };
  
  try {
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const getTimeRemaining = (startTime, endTime) => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  
  if (now < start) {
    // Contest hasn't started yet
    return {
      type: 'starts_in',
      seconds: Math.floor((start - now) / 1000)
    };
  } else if (now >= start && now <= end) {
    // Contest is active
    return {
      type: 'ends_in',
      seconds: Math.floor((end - now) / 1000)
    };
  } else {
    // Contest has ended
    return {
      type: 'ended',
      seconds: 0
    };
  }
};

export const formatCountdown = (seconds) => {
  if (seconds <= 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getCountdownText = (timeInfo) => {
  switch (timeInfo.type) {
    case 'starts_in':
      return `Starts in ${formatCountdown(timeInfo.seconds)}`;
    case 'ends_in':
      return `Ends in ${formatCountdown(timeInfo.seconds)}`;
    case 'ended':
      return 'Contest Ended';
    default:
      return '';
  }
};
