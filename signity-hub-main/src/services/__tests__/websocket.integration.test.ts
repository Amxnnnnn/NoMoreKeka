/**
 * Integration test for WebSocket service
 * Tests the basic functionality without complex mocking
 */

describe('WebSocket Service Integration', () => {
  test('should export websocket service', () => {
    // Simple test to verify the service can be imported
    const websocketModule = require('../websocket.service');
    expect(websocketModule).toBeDefined();
    expect(websocketModule.websocketService).toBeDefined();
  });

  test('should have required methods', () => {
    const { websocketService } = require('../websocket.service');
    
    expect(typeof websocketService.send).toBe('function');
    expect(typeof websocketService.on).toBe('function');
    expect(typeof websocketService.off).toBe('function');
    expect(typeof websocketService.isConnected).toBe('function');
    expect(typeof websocketService.getConnectionStatus).toBe('function');
    expect(typeof websocketService.reconnect).toBe('function');
    expect(typeof websocketService.disconnect).toBe('function');
    expect(typeof websocketService.destroy).toBe('function');
  });

  test('should return connection status object', () => {
    const { websocketService } = require('../websocket.service');
    
    const status = websocketService.getConnectionStatus();
    
    expect(status).toHaveProperty('isConnected');
    expect(status).toHaveProperty('isConnecting');
    expect(status).toHaveProperty('isOnline');
    expect(status).toHaveProperty('queuedMessages');
    expect(status).toHaveProperty('reconnectAttempts');

    expect(typeof status.isConnected).toBe('boolean');
    expect(typeof status.isConnecting).toBe('boolean');
    expect(typeof status.isOnline).toBe('boolean');
    expect(typeof status.queuedMessages).toBe('number');
    expect(typeof status.reconnectAttempts).toBe('number');
  });

  test('should handle event listeners', () => {
    const { websocketService } = require('../websocket.service');
    
    const mockCallback = jest.fn();
    
    // Should not throw when adding listener
    expect(() => {
      websocketService.on('test_event', mockCallback);
    }).not.toThrow();
    
    // Should not throw when removing listener
    expect(() => {
      websocketService.off('test_event', mockCallback);
    }).not.toThrow();
  });

  test('should handle message sending', () => {
    const { websocketService } = require('../websocket.service');
    
    // Clear any existing queue first
    websocketService.clearMessageQueue();
    
    // Should not throw when sending message (will be queued if not connected)
    expect(() => {
      websocketService.send('test_message', { data: 'test' });
    }).not.toThrow();
    
    // Should have queued the message
    const status = websocketService.getConnectionStatus();
    expect(status.queuedMessages).toBe(1);
  });

  test('should handle configuration updates', () => {
    const { websocketService } = require('../websocket.service');
    
    expect(() => {
      websocketService.updateConfig({
        heartbeatInterval: 60000,
        maxReconnectAttempts: 5,
      });
    }).not.toThrow();
  });

  test('should handle cleanup', () => {
    const { websocketService } = require('../websocket.service');
    
    expect(() => {
      websocketService.destroy();
    }).not.toThrow();
  });
});