// Debug utilities for auto image update system

export const debugAutoUpdate = () => {
  console.log('🛠️ Debug Auto Update System');
  
  // Test auto update with a sample group
  const testGroupData = {
    id: 'test-group-123',
    profileImage: 'https://ui-avatars.com/api/?name=Test&background=0066cc&color=ffffff',
    telegramUrl: 'https://t.me/testgroup',
    name: 'Test Group'
  };
  
  console.log('🧪 Testing auto update with:', testGroupData);
  
  // Import and test the service
  import('../services/autoImageUpdateService').then(({ autoImageUpdateService }) => {
    console.log('📊 Auto update service status:', autoImageUpdateService.getStatus());
    
    // Test the should update logic
    const shouldUpdate = (autoImageUpdateService as any).shouldUpdateImage(
      testGroupData.profileImage,
      'https://example.com/real-image.jpg'
    );
    
    console.log('🔍 Should update test result:', shouldUpdate);
  });
};

// Add to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).debugAutoUpdate = debugAutoUpdate;
  console.log('🛠️ Debug function available: window.debugAutoUpdate()');
}