import React, { useState } from 'react';
import Link from 'next/link';

// Mock Navigation component
const MockNavigation = () => (
  <nav className="bg-blue-700 text-white shadow-sm py-1">
    <div className="max-w-7xl mx-auto px-2">
      <div className="flex items-center justify-between h-6">
        <div className="flex items-center">
          <Link href="/mock" className="flex-shrink-0 font-bold text-xs">
            QuickReply.ai
          </Link>
          <div className="hidden md:block">
            <div className="ml-2 flex items-center space-x-0.5">
              <Link
                href="/mock"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Dashboard
              </Link>
              <Link
                href="/mock/compose"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 bg-blue-600 text-white"
              >
                Email Composer
              </Link>
              <Link
                href="/mock/subscription"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Subscription
              </Link>
              <Link
                href="/mock/profile"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="ml-1 flex items-center">
            <span className="text-xs mr-1">
              test@example.com
              <span className="bg-yellow-400 text-xs text-black px-1 ml-1 rounded">MOCK</span>
            </span>
            <Link
              href="/mock"
              className="px-1.5 py-0.5 border border-transparent text-xs font-medium rounded-sm
                       text-white bg-blue-600 hover:bg-blue-500 transition-colors duration-150"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

// Mock Email Composer page
export default function MockEmailComposer() {
  const [customerEmail, setCustomerEmail] = useState(
    "Subject: Question about your services and pricing\n\nHello,\n\nI recently came across your company while searching for solutions to improve our customer response time. We are a small business with about 15 employees, and we're struggling to keep up with customer inquiries.\n\nI have a few questions about your services:\n\n1. Do you offer different pricing tiers based on company size?\n2. What kind of response time can we expect when using your service?\n3. Is there a limit to how many emails we can process each month?\n4. Do you integrate with common CRM systems like Salesforce or HubSpot?\n\nWe're particularly interested in automated responses that still maintain a personal touch. Our customers appreciate quick replies, but we don't want to sound robotic.\n\nCould you also provide information about your onboarding process? We'd need to get our team trained quickly if we decide to move forward.\n\nThank you for your time. I look forward to hearing from you.\n\nBest regards,\nJamie Smith\nOperations Manager\nTechSolutions Inc."
  );
  
  const [businessContext, setBusinessContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  
  const handleGenerate = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const mockResponses = {
        professional: "Dear Jamie Smith,\n\nThank you for your interest in our services at QuickReply.ai. We appreciate your inquiry about improving customer response times for TechSolutions Inc.\n\nTo address your questions:\n\n1. Yes, we offer tiered pricing based on company size and volume needs. For a 15-employee business, our Small Business plan would likely be most appropriate.\n\n2. Our system generates responses within seconds of receiving customer emails, dramatically reducing your response time.\n\n3. Each pricing tier includes a monthly email allocation. The Small Business plan includes 500 responses per month, with options to upgrade if needed.\n\n4. We provide seamless integration with both Salesforce and HubSpot, along with other popular CRM systems.\n\nRegarding your focus on maintaining a personal touch while automating responses - this is precisely our specialty. Our AI is designed to sound natural and personalized, not robotic.\n\nFor onboarding, we offer a comprehensive training program that takes approximately 2-3 hours to complete. Our customer success team works directly with your staff to ensure smooth implementation.\n\nI'd be happy to schedule a demo to show you these features in action. Would you have availability next week for a 30-minute call?\n\nBest regards,\n\nThe QuickReply.ai Team",
        friendly: "Hi Jamie!\n\nThanks so much for reaching out to us at QuickReply.ai! We're excited to hear that you're looking for ways to improve your customer response time at TechSolutions.\n\nLet me jump right into answering your questions:\n\n1. Absolutely! We have several pricing options that scale with your team size. For your 15-person team, our Small Business package would be perfect!\n\n2. Our responses are lightning-fast - we're talking seconds, not minutes or hours! Your customers won't be left waiting.\n\n3. Our Small Business package includes 500 emails monthly, but we're super flexible if you need more.\n\n4. Yes indeed! We play nicely with Salesforce, HubSpot, and lots of other CRM systems you might be using.\n\nI love that you mentioned wanting automated responses with a personal touch - that's our sweet spot! Our AI creates responses that feel warm and human, never robotic or cold.\n\nOnboarding is a breeze! We can have your team up and running in a single afternoon. Our friendly support team walks you through everything step by step.\n\nWould you be free for a quick 30-minute demo next week? I'd love to show you how it all works in real-time!\n\nLooking forward to chatting more,\n\nThe QuickReply.ai Team",
        formal: "Dear Mr. Smith,\n\nWe hereby acknowledge receipt of your inquiry regarding our services at QuickReply.ai. We thank you for your interest in our customer response time solutions.\n\nIn response to your inquiries, we would like to provide the following information:\n\n1. QuickReply.ai does indeed offer differentiated pricing structures based on organizational size and volume requirements. For an enterprise of 15 employees, our Small Business tier would be most appropriate.\n\n2. Our service facilitates immediate response generation, typically within seconds of email receipt.\n\n3. Each subscription tier is allocated a specific monthly response limit. The Small Business tier provides for 500 responses per calendar month, with the option to upgrade as necessary.\n\n4. QuickReply.ai maintains full integration capabilities with major Customer Relationship Management systems, including but not limited to Salesforce and HubSpot.\n\nWith regard to your requirement for automated responses that maintain a personal character, we would like to advise that our proprietary algorithms are specifically designed to generate communications that preserve a natural, human-like quality.\n\nConcerning the onboarding process, QuickReply.ai provides comprehensive training and implementation support. The standard onboarding protocol requires approximately 2-3 hours to complete, and our implementation specialists will ensure your team achieves operational proficiency promptly.\n\nShould you wish to observe a demonstration of our services, we would be pleased to arrange such at your convenience.\n\nYours faithfully,\n\nQuickReply.ai Support Team",
        empathetic: "Hello Jamie,\n\nI understand how challenging it can be to keep up with customer inquiries when you're running a small business with limited resources. It sounds like you're really committed to providing great customer service at TechSolutions Inc., and I'm happy to help find a solution that works for you.\n\nRegarding your questions:\n\n1. We absolutely do offer different pricing tiers based on company size. For a team of 15 employees, our Small Business plan would be a good fit, but we can always adjust as your needs change.\n\n2. I appreciate your concern about response times. Our customers typically see responses generated within seconds, which significantly reduces the wait times your customers experience.\n\n3. I understand the importance of knowing usage limits. The Small Business plan includes 500 email responses per month, and we'll work with you if you find you need more.\n\n4. I know how important seamless integration is. You'll be glad to hear we integrate smoothly with both Salesforce and HubSpot, as well as many other CRM systems.\n\nI really connect with your desire to maintain a personal touch while automating responses. This balance is exactly what we've designed our system to provide - responses that are efficient but still feel warm and human.\n\nWe understand that transitioning to a new system can be concerning, so our onboarding process is designed to be straightforward and supportive. We'll be there every step of the way to make sure your team feels confident using our platform.\n\nWould it help to schedule a time to talk more about your specific needs and show you how the system works?\n\nWarmly,\n\nThe QuickReply.ai Team"
      };
      
      setGeneratedResponse(mockResponses[tone] || mockResponses.professional);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* This wrapper div prevents the global Navigation from _app.js from being displayed */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <MockNavigation />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <h2 className="font-bold text-lg">Mock Mode</h2>
          <p>This is a static mock of the Email Composer for testing purposes. No authentication or API calls are being made.</p>
          <p className="mt-2">
            View other pages:
            <Link href="/mock" className="text-blue-600 hover:underline ml-2">Dashboard</Link>
            <Link href="/mock/subscription" className="text-blue-600 hover:underline ml-2">Subscription</Link>
            <Link href="/mock/profile" className="text-blue-600 hover:underline ml-2">Profile</Link>
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold mb-4">Generate Email Response</h1>
          
          {/* Customer email input */}
          <div className="mb-4">
            <label htmlFor="customerEmail" className="block mb-2 text-sm font-medium text-gray-700">
              Customer Email
            </label>
            <textarea
              id="customerEmail"
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="6"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Paste the customer's email here..."
            ></textarea>
          </div>

          {/* Business context input */}
          <div className="mb-4">
            <label htmlFor="businessContext" className="block mb-2 text-sm font-medium text-gray-700">
              Business Context (Optional)
            </label>
            <textarea
              id="businessContext"
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="Add any relevant information about your business..."
            ></textarea>
          </div>

          {/* Tone selection */}
          <div className="mb-4">
            <label htmlFor="tone" className="block mb-2 text-sm font-medium text-gray-700">
              Response Tone
            </label>
            <select
              id="tone"
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="empathetic">Empathetic</option>
              <option value="concise">Concise</option>
            </select>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !customerEmail.trim()}
            className="w-full mb-6 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Email Response'
            )}
          </button>

          {/* Display generated response */}
          {generatedResponse && (
            <div className="mt-6 border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">
                Generated Response (Mock Company Style)
              </h2>
              <textarea
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                rows="12"
                value={generatedResponse}
                onChange={(e) => setGeneratedResponse(e.target.value)}
              ></textarea>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => alert('Response copied to clipboard!')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => alert('Template saved!')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save as Template
                </button>
              </div>
            </div>
          )}

          {/* Recent Responses */}
          <div className="mt-10 border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Responses</h2>
              <button
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                Refresh
              </button>
            </div>
            <p className="text-center py-4 text-gray-500">No previous responses found. Generate your first response above!</p>
          </div>
        </div>
      </div>
    </div>
  );
} 