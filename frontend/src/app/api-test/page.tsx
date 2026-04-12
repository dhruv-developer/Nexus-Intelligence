'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { authService, chatService, datasetService, queryService, insightService } from '@/lib/api';
import { 
  Send, 
  Upload, 
  Database, 
  MessageSquare, 
  TrendingUp,
  Eye,
  Download,
  Trash2,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ApiResponse {
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
  timestamp: string;
}

interface TestResult {
  endpoint: string;
  method: string;
  response: ApiResponse;
  duration: number;
}

export default function ApiTestPage() {
  const { user, login, logout } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: 'test@example.com', password: 'testpassword123' });
  const [registerForm, setRegisterForm] = useState({ email: 'test2@example.com', password: 'test123', full_name: 'Test User 2' });
  const [chatMessage, setChatMessage] = useState('Show me sales data analysis');
  const [datasetForm, setDatasetForm] = useState({ name: 'Test Dataset', description: 'Test dataset for API testing' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const addTestResult = (endpoint: string, method: string, response: ApiResponse, duration: number) => {
    setTestResults(prev => [{ endpoint, method, response, duration }, ...prev].slice(0, 20));
  };

  const runApiTest = async (testName: string, apiCall: () => Promise<any>) => {
    const startTime = Date.now();
    setCurrentTest(testName);
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      addTestResult(testName, 'API CALL', {
        status: 'success',
        data: result,
        timestamp: new Date().toISOString()
      }, duration);
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      addTestResult(testName, 'API CALL', {
        status: 'error',
        error: error.response?.data?.detail || error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }, duration);
      
      throw error;
    } finally {
      setCurrentTest('');
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // 1. Authentication Tests
      await runApiTest('Login', () => authService.login(loginForm.email, loginForm.password));
      
      if (user) {
        await runApiTest('Get Current User', () => authService.getCurrentUser());
        
        // 2. Chat Tests
        await runApiTest('Send Chat Message', () => chatService.sendMessage(chatMessage));
        await runApiTest('Get Chat History', () => chatService.getHistory());
        
        // 3. Dataset Tests
        await runApiTest('Create Dataset', () => datasetService.createDataset(datasetForm));
        await runApiTest('Get Datasets', () => datasetService.getDatasets());
        
        // 4. Query Tests
        await runApiTest('Create Query', () => queryService.createQuery({
          original_query: 'Analyze sales trends',
          query_type: 'descriptive'
        }));
        
        // 5. Insight Tests
        await runApiTest('Create Insight', () => insightService.createInsight({
          title: 'Sales Analysis',
          headline: 'Revenue increased by 15%',
          explanation: 'Based on Q3 data analysis',
          insight_type: 'trend',
          confidence_score: 0.85,
          significance_score: 0.92
        }));
        
        await runApiTest('Get Insights', () => insightService.getInsights());
      }
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    await runApiTest('Upload Dataset', () => datasetService.uploadDataset(
      selectedFile, 
      datasetForm.name, 
      datasetForm.description
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'loading': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">API Testing Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive testing interface for all backend APIs</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={runAllTests}
              disabled={isRunning}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Tests...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Run All Tests</span>
                </>
              )}
            </button>
            <button 
              onClick={() => setTestResults([])}
              className="btn-secondary"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Authentication Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current User</p>
              <p className="font-medium">
                {user ? `${user.full_name} (${user.email})` : 'Not authenticated'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Actions</p>
              <div className="flex space-x-2">
                {user ? (
                  <button onClick={logout} className="btn-secondary text-sm">
                    Logout
                  </button>
                ) : (
                  <button 
                    onClick={() => authService.login(loginForm.email, loginForm.password)}
                    className="btn-primary text-sm"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* API Test Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authentication Tests */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Authentication APIs
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Login Form</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                <button 
                  onClick={() => runApiTest('Login', () => authService.login(loginForm.email, loginForm.password))}
                  className="btn-primary w-full"
                >
                  Test Login
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Register Form</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={registerForm.full_name}
                  onChange={(e) => setRegisterForm({...registerForm, full_name: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                <button 
                  onClick={() => runApiTest('Register', () => authService.register(registerForm.email, registerForm.password, registerForm.full_name))}
                  className="btn-secondary w-full"
                >
                  Test Register
                </button>
              </div>
            </div>
          </div>

          {/* Chat Tests */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat APIs
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chat Message</label>
                <textarea
                  placeholder="Enter your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="w-full p-2 border rounded-md h-24"
                />
                <button 
                  onClick={() => runApiTest('Send Message', () => chatService.sendMessage(chatMessage))}
                  className="btn-primary w-full"
                >
                  Send Message
                </button>
              </div>
              
              <button 
                onClick={() => runApiTest('Get Chat History', () => chatService.getHistory())}
                className="btn-secondary w-full"
              >
                Get Chat History
              </button>
            </div>
          </div>

          {/* Dataset Tests */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Dataset APIs
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dataset Info</label>
                <input
                  type="text"
                  placeholder="Dataset Name"
                  value={datasetForm.name}
                  onChange={(e) => setDatasetForm({...datasetForm, name: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={datasetForm.description}
                  onChange={(e) => setDatasetForm({...datasetForm, description: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
                <button 
                  onClick={() => runApiTest('Create Dataset', () => datasetService.createDataset(datasetForm))}
                  className="btn-primary w-full"
                >
                  Create Dataset
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">File Upload</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded-md"
                />
                <button 
                  onClick={handleFileUpload}
                  disabled={!selectedFile}
                  className="btn-secondary w-full disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2 inline" />
                  Upload File
                </button>
              </div>
              
              <button 
                onClick={() => runApiTest('Get Datasets', () => datasetService.getDatasets())}
                className="btn-secondary w-full"
              >
                Get All Datasets
              </button>
            </div>
          </div>

          {/* Query & Insight Tests */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Query & Insight APIs
            </h2>
            <div className="space-y-4">
              <button 
                onClick={() => runApiTest('Create Query', () => queryService.createQuery({
                  original_query: 'Analyze sales trends',
                  query_type: 'descriptive'
                }))}
                className="btn-primary w-full"
              >
                Create Query
              </button>
              
              <button 
                onClick={() => runApiTest('Get Queries', () => queryService.getQueries())}
                className="btn-secondary w-full"
              >
                Get All Queries
              </button>
              
              <button 
                onClick={() => runApiTest('Create Insight', () => insightService.createInsight({
                  title: 'Sales Analysis',
                  headline: 'Revenue increased by 15%',
                  explanation: 'Based on Q3 data analysis',
                  insight_type: 'trend',
                  confidence_score: 0.85,
                  significance_score: 0.92
                }))}
                className="btn-primary w-full"
              >
                Create Insight
              </button>
              
              <button 
                onClick={() => runApiTest('Get Insights', () => insightService.getInsights())}
                className="btn-secondary w-full"
              >
                Get All Insights
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Test Results
            </h2>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.response.status)}
                      <span className="font-medium">{result.endpoint}</span>
                      <span className="text-sm text-muted-foreground">({result.method})</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{result.duration}ms</span>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">{result.response.timestamp}</p>
                    {result.response.status === 'success' ? (
                      <div className="bg-green-50 p-2 rounded text-green-800">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(result.response.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-red-50 p-2 rounded text-red-800">
                        <p>{result.response.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Test Status */}
        {currentTest && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running: {currentTest}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
