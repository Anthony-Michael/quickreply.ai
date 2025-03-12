export const mockGenerateResponse = jest.fn().mockResolvedValue({
  generated_text: 'This is a test generated response.',
  success: true,
});

export const mockSaveEmailHistory = jest.fn().mockResolvedValue({
  success: true,
  data: { id: 'mock-email-id' },
});

// Mock implementation of the openai.js module
const openaiMock = {
  generateResponse: mockGenerateResponse,
  saveEmailHistory: mockSaveEmailHistory,
};

export default openaiMock;
