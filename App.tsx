
import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Project, 
  ProjectStatus, 
  TeamRole, 
  AppState, 
  Deliverable 
} from './types';
import { generateOpsReport, generateActionDocument } from './openaiService';

const INITIAL_STATE: AppState = {
  projects: [
    { id: '1', name: 'Downtown Plaza Renovation', startDate: '2024-03-01', endDate: '2024-05-15', status: ProjectStatus.IN_PROGRESS, team: TeamRole.BUILD, priority: 'High' },
    { id: '2', name: 'Westside Estate Maintenance', startDate: '2024-03-10', endDate: '2024-09-30', status: ProjectStatus.IN_PROGRESS, team: TeamRole.MAINTENANCE, priority: 'Medium' },
    { id: '3', name: 'Modern Zen Garden Design', startDate: '2024-04-01', endDate: '2024-04-20', status: ProjectStatus.PLANNING, team: TeamRole.DESIGN, priority: 'Medium' },
    { id: '4', name: 'Riverview Commercial Build', startDate: '2024-05-01', endDate: '2024-08-01', status: ProjectStatus.PLANNING, team: TeamRole.BUILD, priority: 'High' },
  ],
  availability: [
    { role: TeamRole.DESIGN, capacity: 85, headcount: 4 },
    { role: TeamRole.BUILD, capacity: 95, headcount: 12 },
    { role: TeamRole.MAINTENANCE, capacity: 60, headcount: 8 },
  ],
  inventory: [
    { name: 'Structural Steel', quantity: 12, unit: 'Tons', status: 'Low' },
    { name: 'Native Shrubs', quantity: 450, unit: 'Units', status: 'Adequate' },
    { name: 'Granite Pavers', quantity: 50, unit: 'Sq Ft', status: 'Critical' },
  ]
};

const TRIGGER_PHRASES = [
  "create a plan", "next steps", "strategy", "summary", "action plan", 
  "put this together", "i'm done", "that's good", "move forward"
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [report, setReport] = useState<string>('');
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'resources' | 'deliverables'>('dashboard');
  const [command, setCommand] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleGenerateReport = async (query?: string) => {
    setIsGenerating(true);
    const result = await generateOpsReport(state, query);
    setReport(result);
    setIsGenerating(false);
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const lowerCommand = command.toLowerCase();
    const isDeliverableTriggered = TRIGGER_PHRASES.some(phrase => lowerCommand.includes(phrase));

    setIsGenerating(true);
    if (isDeliverableTriggered) {
      const doc = await generateActionDocument(state, command);
      const newDeliverable: Deliverable = {
        id: Date.now().toString(),
        title: command.length > 30 ? command.substring(0, 30) + '...' : command,
        date: new Date().toLocaleDateString(),
        content: doc
      };
      setDeliverables(prev => [newDeliverable, ...prev]);
      setActiveTab('deliverables');
    } else {
      const result = await generateOpsReport(state, command);
      setReport(result);
      setActiveTab('dashboard');
    }
    setCommand('');
    setIsGenerating(false);
  };

  useEffect(() => {
    handleGenerateReport();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'Low': return 'text-amber-600 bg-amber-100';
      case 'Adequate': return 'text-emerald-600 bg-emerald-100';
      case ProjectStatus.IN_PROGRESS: return 'text-blue-600 bg-blue-100';
      case ProjectStatus.STALLED: return 'text-red-600 bg-red-100';
      case ProjectStatus.PLANNING: return 'text-slate-600 bg-slate-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">LBJ-Ops-AI</h1>
            <span className="hidden lg:inline-block px-2 py-0.5 bg-indigo-500/20 border border-indigo-400/30 text-[10px] rounded uppercase font-semibold text-indigo-200">
              Operations Intelligence
            </span>
          </div>
          <nav className="flex gap-4 md:gap-6 text-sm font-medium">
            <button onClick={() => setActiveTab('dashboard')} className={`hover:text-indigo-300 transition-colors ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`}>Intelligence</button>
            <button onClick={() => setActiveTab('projects')} className={`hover:text-indigo-300 transition-colors ${activeTab === 'projects' ? 'text-indigo-400' : 'text-slate-400'}`}>Projects</button>
            <button onClick={() => setActiveTab('resources')} className={`hover:text-indigo-300 transition-colors ${activeTab === 'resources' ? 'text-indigo-400' : 'text-slate-400'}`}>Resources</button>
            <button onClick={() => setActiveTab('deliverables')} className={`hover:text-indigo-300 transition-colors ${activeTab === 'deliverables' ? 'text-indigo-400 underline underline-offset-8' : 'text-slate-400'}`}>Deliverables</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            {activeTab === 'dashboard' && (
              <>
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Operational Summary
                    </h2>
                    {isGenerating && (
                      <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold animate-pulse">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Intelligence Engine Active
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    {report ? (
                      <div className="prose prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm bg-slate-50 p-6 rounded-lg border border-slate-100">
                          {report}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <p>Awaiting operational input...</p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Team Utilization</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={state.availability}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          />
                          <Bar dataKey="capacity" radius={[4, 4, 0, 0]} barSize={40}>
                            {state.availability.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.capacity > 90 ? '#ef4444' : entry.capacity > 75 ? '#f59e0b' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Inventory Risks</h3>
                    <div className="space-y-4">
                      {state.inventory.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                          <div>
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.quantity} {item.unit}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            )}

            {activeTab === 'projects' && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <h2 className="text-lg font-semibold">Active Project Pipeline</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.projects.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-medium text-slate-900">{project.name}</td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{project.team}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'deliverables' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800">Operational Deliverables</h2>
                {deliverables.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                    No action documents generated yet. Use the Command Center to trigger Deliverable Mode.
                  </div>
                ) : (
                  deliverables.map((doc) => (
                    <div key={doc.id} className="bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden">
                      <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Formal Deliverable</span>
                        <span className="text-xs font-medium opacity-70">{doc.date}</span>
                      </div>
                      <div className="p-10 font-serif bg-white text-slate-800 leading-relaxed shadow-inner">
                        <pre className="whitespace-pre-wrap font-serif text-sm md:text-base selection:bg-indigo-100">
                          {doc.content}
                        </pre>
                      </div>
                      <div className="bg-slate-50 p-4 border-t border-slate-200 text-right">
                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                          Download PDF (Simulated)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-xl shadow-sm border-t-4 border-t-indigo-600 border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Strategic Command</h3>
              <form onSubmit={handleCommand} className="space-y-3">
                <textarea 
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Ask for an update or type 'create a plan'..."
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none bg-slate-50"
                />
                <button 
                  type="submit"
                  disabled={isGenerating || !command.trim()}
                  className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                >
                  {isGenerating ? 'Processing...' : 'Execute Intelligence'}
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Trigger Phrases:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['create a plan', 'next steps', 'i\'m done'].map(p => (
                    <span key={p} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded cursor-help" title="Triggers Deliverable Mode">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <div className="bg-indigo-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-1">Ops Health Index</h3>
                 <p className="text-4xl font-bold mb-4">84%</p>
                 <div className="h-1.5 w-full bg-indigo-800 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-emerald-400 w-[84%]"></div>
                 </div>
                 <p className="text-xs text-indigo-300 leading-relaxed">
                   System optimized. Leadership clarity is high. Monitoring active bottlenecks in material supply.
                 </p>
               </div>
               <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-800/30 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Status Log</h3>
              <div className="space-y-4">
                {[
                  { icon: '📦', text: 'Granite Pavers: Critical', color: 'text-red-500' },
                  { icon: '🏗️', text: 'Build team: 95% Cap', color: 'text-amber-500' },
                  { icon: '🤖', text: 'Intelligence Engine: Ready', color: 'text-emerald-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${item.color}`}>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
      
      <footer className="mt-auto border-t border-slate-200 py-6 bg-white text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">LBJ-Ops-AI | Operations & Delivery Intelligence System | v1.1.0 (DELIVERABLE ENABLED)</p>
      </footer>
    </div>
  );
};

export default App;
