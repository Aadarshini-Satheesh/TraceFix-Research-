import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import NewSessionPage from './pages/NewSessionPage';
import RepositoryAnalysisPage from './pages/RepositoryAnalysisPage';
import InvestigationPage from './pages/InvestigationPage';
import RegressionTestFirstPage from './pages/RegressionTestFirstPage';
import RepairWorkspacePage from './pages/RepairWorkspacePage';
import PatchComparisonPage from './pages/PatchComparisonPage';
import TestVerificationPage from './pages/TestVerificationPage';
import ResearchExperimentsPage from './pages/ResearchExperimentsPage';
import BenchmarkResultsPage from './pages/BenchmarkResultsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { getSettings } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSession, setActiveSession] = useState(null);
  const [settingsInfo, setSettingsInfo] = useState(null);

  useEffect(() => {
    getSettings()
      .then(cfg => setSettingsInfo(cfg))
      .catch(err => console.error(err));
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} setActiveSession={setActiveSession} />;
      case 'new-session':
        return <NewSessionPage setActiveTab={setActiveTab} setActiveSession={setActiveSession} />;
      case 'repository-analysis':
        return <RepositoryAnalysisPage />;
      case 'investigation':
        return <InvestigationPage activeSession={activeSession} setActiveSession={setActiveSession} setActiveTab={setActiveTab} />;
      case 'test-first':
        return <RegressionTestFirstPage activeSession={activeSession} setActiveSession={setActiveSession} setActiveTab={setActiveTab} />;
      case 'repair-workspace':
        return <RepairWorkspacePage activeSession={activeSession} setActiveSession={setActiveSession} setActiveTab={setActiveTab} />;
      case 'patch-comparison':
        return <PatchComparisonPage activeSession={activeSession} setActiveSession={setActiveSession} setActiveTab={setActiveTab} />;
      case 'verification':
        return <TestVerificationPage activeSession={activeSession} setActiveSession={setActiveSession} setActiveTab={setActiveTab} />;
      case 'experiments':
        return <ResearchExperimentsPage />;
      case 'benchmarks':
        return <BenchmarkResultsPage setActiveTab={setActiveTab} setActiveSession={setActiveSession} />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage settingsInfo={settingsInfo} setSettingsInfo={setSettingsInfo} />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} setActiveSession={setActiveSession} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#090D16] text-slate-100 overflow-hidden font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeTab={activeTab} activeSession={activeSession} settingsInfo={settingsInfo} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#090D16] to-[#06080F]">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
