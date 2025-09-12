import { GroupWithStats } from "@/services/enhancedGroupService";

// Generate fake popular groups by randomizing the order
export const getFakePopularGroups = async (
  allGroups: GroupWithStats[],
  limitCount: number = 10
): Promise<GroupWithStats[]> => {
  try {
    // Create a shuffled copy of the groups
    const shuffledGroups = [...allGroups].sort(() => Math.random() - 0.5);
    
    // Add fake view counts to make them look popular
    const groupsWithFakeViews = shuffledGroups.map(group => ({
      ...group,
      viewCount: Math.floor(Math.random() * 15000) + 10000 // Random views between 10k-25k
    }));
    
    // Sort by fake view count to maintain the "popular" order
    return groupsWithFakeViews
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error generating fake popular groups:", error);
    return [];
  }
};

// Generate fake analytics data for charts
export const getFakeAnalyticsData = (period: '24h' | '7d' | '30d') => {
  const now = new Date();
  const data = [];
  
  let days = 7;
  switch (period) {
    case '24h':
      days = 1;
      break;
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
  }
  
  let totalVisits = 0;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate fake visit counts with some randomness
    const baseVisits = Math.floor(Math.random() * 50) + 20; // 20-70 visits per day
    const visits = Math.max(1, baseVisits + Math.floor(Math.random() * 20) - 10);
    
    totalVisits += visits;
    
    data.push({
      date: dateStr,
      visits
    });
  }
  
  return {
    totalVisits,
    dailyData: data,
    period
  };
};

// Generate fake daily stats
export const getFakeDailyStats = (days: number = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  const statsArray = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    // Generate fake visit data
    const visits = Math.floor(Math.random() * 80) + 30; // 30-110 visits
    const uniqueVisitors = Math.floor(visits * 0.7) + Math.floor(Math.random() * 10); // ~70% unique
    
    statsArray.push({
      date: dateStr,
      visits,
      uniqueVisitors
    });
  }
  
  return statsArray.sort((a, b) => a.date.localeCompare(b.date));
};