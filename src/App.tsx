/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieChart,
  Menu,
  Search,
  Bell,
  Globe,
  LogOut,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Edit2,
  FileText,
  X,
  Check,
  RotateCcw,
  Sliders,
  Type,
  Activity,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Database,
  ArrowRight,
  Info,
  Maximize2
} from 'lucide-react';

import { Indicator, ScoreDetail } from './types';
import { CITIES, INITIAL_INDICATORS } from './data';

export default function App() {
  // State
  const [indicators, setIndicators] = useState<Indicator[]>(INITIAL_INDICATORS);
  const [selectedRole, setSelectedRole] = useState<'filler' | 'approver'>('filler');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [isMainModalOpen, setIsMainModalOpen] = useState(true);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalComment, setApprovalComment] = useState('');
  const [fontSizeMode, setFontSizeMode] = useState<'normal' | 'large'>('normal');
  
  // Inline edit state for "审批说明" (Description)
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [tempDescValue, setTempDescValue] = useState('');
  const descInputRef = useRef<HTMLInputElement>(null);

  // Inline edit state for Scores
  const [editingScore, setEditingScore] = useState<{ indicatorId: string; cityKey: string } | null>(null);
  const [tempScoreValue, setTempScoreValue] = useState('');

  // Dropdowns
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto dismiss alert
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const triggerAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ text, type });
  };

  // Switch role helper
  const handleRoleChange = (role: 'filler' | 'approver') => {
    setSelectedRole(role);
    // Clear selections and temp editing
    setSelectedRowIds(new Set());
    setEditingScore(null);
    setEditingDescId(null);
    triggerAlert(`已成功切换至：${role === 'filler' ? '填报者视角' : '审批者视角'}`, 'info');
  };

  // Computed live dashboard KPIs calculated on-the-fly!
  const dashboardStats = useMemo(() => {
    const leafNodes = indicators.filter(ind => ind.nodeType === 'leaf');
    const totalLeafCount = leafNodes.length;
    const approvedCount = leafNodes.filter(ind => ind.status === 'approved').length;
    const pendingCount = leafNodes.filter(ind => ind.status === 'pending').length;
    const rejectedCount = leafNodes.filter(ind => ind.status === 'rejected').length;

    // Calculate dynamic city averages (using approver value or filler value depending on active state)
    const cityAverages = CITIES.map(city => {
      let sum = 0;
      leafNodes.forEach(ind => {
        sum += ind.scores[city.key].approverValue;
      });
      const avg = sum / (totalLeafCount || 1);
      return {
        ...city,
        average: avg
      };
    });

    const sortedCities = [...cityAverages].sort((a, b) => b.average - a.average);
    const bestCity = sortedCities[0] || { name: '暂无数据', average: 0 };

    return {
      totalLeafCount,
      approvedCount,
      pendingCount,
      rejectedCount,
      bestCity,
      cityAverages
    };
  }, [indicators]);

  // All checkbox toggles for leaf indicators (approver only)
  const activeUnapprovedLeafs = useMemo(() => {
    return indicators.filter(ind => ind.nodeType === 'leaf' && ind.status !== 'approved');
  }, [indicators]);

  const isAllSelected = useMemo(() => {
    if (activeUnapprovedLeafs.length === 0) return false;
    return activeUnapprovedLeafs.every(ind => selectedRowIds.has(ind.id));
  }, [activeUnapprovedLeafs, selectedRowIds]);

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      // Uncheck all items
      setSelectedRowIds(new Set());
    } else {
      // Check all active unapproved item leaf nodes
      const newSet = new Set<string>();
      activeUnapprovedLeafs.forEach(ind => newSet.add(ind.id));
      setSelectedRowIds(newSet);
    }
  };

  const handleRowCheckboxToggle = (id: string) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRowIds(newSet);
  };

  // Edit Description inline
  const startEditingDescription = (id: string, currentVal: string) => {
    if (selectedRole !== 'approver') return; // Only approver is authorized to overwrite comments
    setEditingDescId(id);
    setTempDescValue(currentVal || '');
    // Focus after render
    setTimeout(() => {
      if (descInputRef.current) descInputRef.current.focus();
    }, 50);
  };

  const saveDescription = (id: string) => {
    setIndicators(prev => prev.map(ind => {
      if (ind.id === id) {
        return { ...ind, description: tempDescValue.trim() };
      }
      return ind;
    }));
    setEditingDescId(null);
    triggerAlert('指标说明更新成功');
  };

  // Edit Scores inline
  const startEditingScore = (indicatorId: string, cityKey: string, currentVal: number, status: string, nodeType: string) => {
    // Permission Checks as per original logic:
    // 1. filler can ONLY edit rejected leaf indicators
    // 2. approver can ONLY edit unapproved leaf indicators
    if (selectedRole === 'filler') {
      if (nodeType !== 'leaf' || status !== 'rejected') return;
    } else {
      if (nodeType !== 'leaf' || status === 'approved') return;
    }

    setEditingScore({ indicatorId, cityKey });
    setTempScoreValue(currentVal.toString());
  };

  const saveScore = () => {
    if (!editingScore) return;
    const parsed = parseFloat(tempScoreValue);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      triggerAlert('请输入有效的评分分值 (0.0000 - 100.0000)', 'error');
      return;
    }

    const fixedValue = parseFloat(parsed.toFixed(4));

    setIndicators(prev => prev.map(ind => {
      if (ind.id === editingScore.indicatorId) {
        const updateScores = { ...ind.scores };
        const oldDetail = updateScores[editingScore.cityKey];

        if (selectedRole === 'filler') {
          // Filler updates filler score and resets approver score to keep sync
          updateScores[editingScore.cityKey] = {
            ...oldDetail,
            fillerValue: fixedValue,
            approverValue: fixedValue // syncing initially
          };
        } else {
          // Approver only overrides the final approval score
          updateScores[editingScore.cityKey] = {
            ...oldDetail,
            approverValue: fixedValue
          };
        }
        return { ...ind, scores: updateScores };
      }
      return ind;
    }));

    setEditingScore(null);
    triggerAlert('评分更新成功');
  };

  // Open batch modal helper
  const handleBatchActionChange = (action: 'approve' | 'reject') => {
    if (selectedRowIds.size === 0) {
      triggerAlert('请先在表格左端勾选要处理的指标', 'error');
      return;
    }
    setApprovalAction(action);
    setApprovalComment(action === 'approve' ? '同意。' : '');
    setIsApprovalModalOpen(true);
  };

  // Submit batch approval/rejection comments and state transitions
  const submitBatchApproveOrReject = () => {
    if (approvalAction === 'reject' && !approvalComment.trim()) {
      triggerAlert('退回指标时，必须填写合理的审批说明以指导整改！', 'error');
      return;
    }

    setIndicators(prev => prev.map(ind => {
      if (selectedRowIds.has(ind.id) && ind.nodeType === 'leaf') {
        return {
          ...ind,
          status: approvalAction === 'approve' ? 'approved' : 'rejected',
          description: approvalComment.trim() || ind.description
        };
      }
      return ind;
    }));

    const count = selectedRowIds.size;
    setSelectedRowIds(new Set());
    setIsApprovalModalOpen(false);
    triggerAlert(`已成功批量处理 ${count} 个业绩指标为：${approvalAction === 'approve' ? '已通过' : '已退回'}`);
  };

  // Filter indicator table search
  const filteredIndicators = useMemo(() => {
    if (!searchQuery.trim()) return indicators;
    return indicators.filter(ind => ind.name.includes(searchQuery.trim()));
  }, [indicators, searchQuery]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-900 select-none">
      
      {/* Dynamic Floating Toast Alerts */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-14 left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2 text-xs font-medium border ${
              alertMessage.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : alertMessage.type === 'info'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {alertMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            ) : alertMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAVIGATION BAR */}
      <header className="h-[48px] bg-blue-600 flex items-center justify-between px-4 text-white shrink-0 shadow-md z-40 relative">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5 font-sans tracking-tight">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center border border-white/40 shadow-sm animate-pulse">
              <PieChart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[14px] font-semibold tracking-wide">数字化工作台 DMN</span>
          </div>
          <button 
            onClick={() => triggerAlert("点击全局菜单，目前处于业绩填报与审核核心页面", "info")}
            className="p-1 hovered:bg-white/10 rounded transition-colors text-white/90 hover:text-white"
            title="主菜单"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Global actions and indicators */}
        <div className="flex items-center space-x-4">
          {/* Quick Font Sizer Tt */}
          <button
            onClick={() => {
              setFontSizeMode(prev => prev === 'normal' ? 'large' : 'normal');
              triggerAlert(`界面字体已调整为：${fontSizeMode === 'normal' ? '超大视角' : '标准视角'}`, 'info');
            }}
            className={`p-1.5 rounded transition-colors flex items-center space-x-1 border ${
              fontSizeMode === 'large' 
                ? 'bg-white text-blue-600 border-white' 
                : 'border-white/20 text-white/90 hover:bg-white/10'
            }`}
            title="调节系统字体大小"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium leading-none">
              {fontSizeMode === 'large' ? '大松弛' : '标准'}
            </span>
          </button>

          {/* Quick Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="搜索业绩指标名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 text-white placeholder-white/60 text-xs rounded-full pl-8 pr-3 py-1 w-44 border border-white/20 focus:text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all font-medium"
            />
            <Search className="w-3.5 h-3.5 text-white/75 absolute left-2.5 top-1.5" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1.5 p-0.5 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Alert Bell */}
          <div className="relative cursor-pointer hover:bg-white/10 p-1.5 rounded-full transition-colors">
            <Bell className="w-4 h-4" />
            {dashboardStats.pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 border-2 border-blue-600 text-[9px] font-bold text-white w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                {dashboardStats.pendingCount}
              </span>
            )}
          </div>

          {/* Interactive User profile panel */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(prev => !prev)}
              className="flex items-center space-x-2 px-2.5 py-1 rounded hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-white/25"
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold">欢迎您，游平</span>
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40 outline-none" onClick={() => setIsProfileOpen(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl py-3 border border-slate-200 z-50 text-slate-800 text-xs"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-900 text-sm">游平 (高级总监)</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">ypp202604@gmail.com</p>
                      <div className="mt-2.5 flex items-center space-x-1.5">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 font-bold text-[10px]">福建省公司</span>
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5 font-bold text-[10px]">信息化中心主任</span>
                      </div>
                    </div>
                    <div className="py-1">
                      <button 
                        onClick={() => { setIsProfileOpen(false); triggerAlert("系统设置正在接入DMN工作流", "info"); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>个人效能工作台配置</span>
                      </button>
                      <button 
                        onClick={() => { setIsProfileOpen(false); triggerAlert("福建九地市业绩细则说明库加载完毕", "info"); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>一季度考评标准细则</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100 mt-2 pt-2 px-3">
                      <button 
                        onClick={() => { setIsProfileOpen(false); triggerAlert("登出功能为演示模式", "info"); }}
                        className="w-full text-center py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium rounded transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>注销登录 (DMN)</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* CORE FRAMEWORK BODY - SIDEBAR + MAIN PANELS */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR NAVIGATION (DMN Styled) */}
        <aside className="w-[200px] bg-slate-900 text-slate-300 flex flex-col overflow-y-auto shrink-0 z-20">
          <div className="py-2 flex-1">
            
            {/* Header section toggle simulation */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 text-white">
              <div className="flex items-center space-x-2.5 font-medium">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold tracking-wide">绩效管理</span>
              </div>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="bg-slate-950/40 py-1 border-t border-slate-950">
              <div className="flex items-center justify-between px-4 py-2 pl-6 text-slate-100 font-medium">
                <div className="flex items-center space-x-2">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs">业绩指标</span>
                </div>
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              </div>
              
              {/* Menu items */}
              <div className="py-1 space-y-0.5">
                <button 
                  onClick={() => triggerAlert("当前页为 [指标填报/审批]。如需重新设计指标，请在设计中心操作。", "info")}
                  className="w-full text-left px-4 py-2 pl-12 text-slate-400 hover:text-slate-100 transition-colors text-xs hover:bg-slate-800/50"
                >
                  业绩指标设计
                </button>
                <button 
                  onClick={() => setIsMainModalOpen(true)}
                  className="w-full text-left px-4 py-2 pl-12 text-blue-400 bg-slate-800 font-semibold transition-all text-xs menu-active-glow flex items-center justify-between"
                >
                  <span className="truncate">填报/审批工作流</span>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar Footprint System details */}
          <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1 bg-slate-950/40">
            <p>系统：DMN v3.5-Enterprise</p>
            <p>角色授权：游平 (双控审计)</p>
            <p>工作区模式：实时热更</p>
          </div>
        </aside>

        {/* RIGHT AREA BACKGROUND CANVAS - INTERACTIVE DOCK & BACKDROP VIEW */}
        <main className="flex-1 bg-slate-100 relative flex flex-col min-w-0 watermark-bg overflow-y-auto">
          
          {/* Subheader page banner */}
          <div className="px-6 py-3.5 bg-white border-b border-slate-200 mt-0 flex justify-between items-center shrink-0">
            <div>
              <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">WORKSPACE / PERFORMANCE CANVAS</div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mt-0.5">
                <span>数字化指标工作台主控制画布</span>
              </h2>
            </div>
            
            <button
               onClick={() => setIsMainModalOpen(true)}
               className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow hover:shadow-md transition-all flex items-center space-x-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>还原并显示双工作流视窗</span>
            </button>
          </div>

          {/* BACKDROP BEAUTIFUL REAL-TIME METRICS (Highly Optimized Dashboard) */}
          <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
            
            {/* Dynamic system introduction with live states */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-6 text-white shadow-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="bg-white/20 text-white py-0.5 px-2 rounded-full text-[10px] font-bold">考评期：2026年第1季度</span>
                  <h3 className="text-lg font-bold font-display mt-2">福建省九地市业绩指标双渠道交互中心</h3>
                  <p className="text-xs text-blue-100 max-w-xl">
                    欢迎进入游平总监的数字化绩效工作流控制台。本页面支持数据随时热备份修改。您可以在双视角工作流窗口中进行各公司填报细节和最终批准数据的审查、退回与意见签注。
                  </p>
                </div>
                <div className="flex flex-col items-end text-right text-xs bg-black/15 p-2 rounded border border-white/10 shrink-0">
                  <span className="text-blue-200 font-mono">2026 Q1 EVALUATION</span>
                  <span className="font-bold font-mono text-sm leading-none mt-1">PROVINCIAL DMN</span>
                </div>
              </div>

              {/* Action grid button */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setIsMainModalOpen(true)}
                  className="px-5 py-2 bg-white text-blue-700 font-bold rounded text-xs hover:bg-slate-100 transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  <span>立即加载交互窗口</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center space-x-2 text-xs text-blue-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>实时状态监视已启用 (指标状态更新自动关联画布图表)</span>
                </div>
              </div>
            </div>

            {/* REAL-TIME COMPUTED STATS BLOCK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* KPI Card 1 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-semibold">末端指标总数</span>
                  <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 font-mono">{dashboardStats.totalLeafCount} <span className="text-xs font-normal text-slate-400">个</span></h4>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                    <span className="text-blue-600 font-bold">100%</span>
                    <span>可联动审批审查</span>
                  </p>
                </div>
              </div>

              {/* KPI Card 2 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-semibold">待处理 / 审批项</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${dashboardStats.pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold font-mono text-slate-800">
                    {dashboardStats.pendingCount} <span className="text-xs font-normal text-slate-400">个</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                    {dashboardStats.pendingCount > 0 ? (
                      <>
                        <span className="text-amber-500 font-bold animate-pulse">需尽快审核</span>
                        <span>暂挂待决中</span>
                      </>
                    ) : (
                      <span className="text-emerald-600 font-bold">所有指标全部办结</span>
                    )}
                  </p>
                </div>
              </div>

              {/* KPI Card 3 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-semibold">审核退回整改率</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${dashboardStats.rejectedCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold font-mono text-indigo-900">
                    {dashboardStats.rejectedCount} <span className="text-xs font-normal text-slate-400">个</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {dashboardStats.rejectedCount > 0 ? (
                      <span className="text-red-500 font-semibold">填报者可重新修改分值</span>
                    ) : (
                      <span>零退回，表现平稳</span>
                    )}
                  </p>
                </div>
              </div>

              {/* KPI Card 4 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-semibold">福建省一期之冠</span>
                  <div className="w-7 h-7 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-700 truncate">{dashboardStats.bestCity.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    实时综合考核分：<span className="font-mono text-dark font-bold text-slate-800">{dashboardStats.bestCity.average.toFixed(4)}</span>
                  </p>
                </div>
              </div>

            </div>

            {/* LIVE BAR GRAPH (Fully Dynamic, Rendered purely in SVG and React!) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 space-y-2 sm:space-y-0">
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800">福建九地市 · 综合考核得分实时走势图</h4>
                  <p className="text-xs text-slate-500 mt-0.5">计算基准：各末端指标考核分均值测算。修改或审批指标后自动实时重算走势</p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
                    <span>综合考评分值</span>
                  </div>
                </div>
              </div>

              {/* Responsive custom HTML dynamic chart with animated height metrics */}
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-4 pt-4 min-h-[160px] items-end">
                {dashboardStats.cityAverages.map((city, ind) => {
                  // Normalize score between 80 and 100 for better graphical visual variance (otherwise 97 and 99 look identical)
                  const scoreOffset = city.average - 70; // Map from 70-100
                  const barHeightPercent = Math.min(Math.max((scoreOffset / 30) * 100, 10), 100);

                  const isGold = city.key === dashboardStats.bestCity.key;

                  return (
                    <div key={city.key} className="flex flex-col items-center group relative cursor-pointer">
                      {/* Tooltip */}
                      <div className="absolute -top-12 bg-slate-900 text-white rounded text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-10 text-center whitespace-nowrap shadow-md">
                        <p className="font-bold">{city.name}</p>
                        <p className="font-mono text-blue-300">{city.average.toFixed(4)}</p>
                      </div>

                      {/* Score on top of bar */}
                      <span className="text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 mb-1 group-hover:text-blue-600">
                        {city.average.toFixed(2)}
                      </span>

                      {/* Bar content */}
                      <div className="w-full bg-slate-100 rounded-t-md relative min-h-[120px] flex items-end overflow-hidden shadow-inner">
                        <motion.div 
                          className={`w-full rounded-t-md transition-all ${
                            isGold 
                              ? 'bg-gradient-to-t from-emerald-500 to-teal-400' 
                              : 'bg-gradient-to-t from-blue-600 to-indigo-500'
                          }`}
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeightPercent}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>

                      {/* City label name */}
                      <span className="text-xs text-slate-600 font-semibold mt-2 group-hover:text-slate-900 group-hover:underline">
                        {city.name.replace('公司', '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Access Actions & Information Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">系统提示与填报说明</h4>
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong>填报者权限：</strong>当前您获权访问游平填报权限，您可以针对标记为 <span className="bg-red-50 text-red-600 px-1 py-0.5 rounded font-semibold border border-red-200">已退回</span> 的指标修改蓝色指标分值。保存后，流程自动驳回到待审批审核。
                  </p>
                  <p>
                    <strong>审核审批权限：</strong>可随意针对未审批指标修改右列绿色通过分数。同时，支持在末端指标行前多选，点击左下方 <span className="bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded font-semibold border border-emerald-200">批量通过</span> 或 <span className="bg-red-50 text-red-600 px-1 py-0.5 rounded font-semibold border border-red-200">批量退回</span>，一键录入意见，刷新进度。
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 p-5 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-widest leading-none">DMN WORKFLOW STATIONS</h4>
                  <p className="text-[13px] font-bold">数字化一季度全地市总指标列表核完状态</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    全部考核参数包含主干指标 (数字化发展指数、工作合规指标、架构体系) 共六大块数据。如有整改项请及时填写审核附注进行保存并发送。
                  </p>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/10 shrink-0">
                  <div className="flex space-x-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">合格指标 / 总数</span>
                      <span className="font-bold text-white">{dashboardStats.approvedCount} / {dashboardStats.totalLeafCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">处理百分之</span>
                      <span className="font-bold text-blue-400">
                        {((dashboardStats.approvedCount + dashboardStats.rejectedCount) / (dashboardStats.totalLeafCount || 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIndicators(INITIAL_INDICATORS);
                      setSelectedRowIds(new Set());
                      triggerAlert("指标数据已经成功重置为演示初始参数值", "info");
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded text-[11px] font-bold transition-all"
                  >
                    重置演示数据
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ======================================================= */}
      {/* ================= === MAIN WORKFLOW DIALOG MODAL === ================= */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isMainModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-[1550px] h-[93vh] overflow-hidden relative border border-slate-200 ${
                fontSizeMode === 'large' ? 'text-[15px]' : 'text-[13px]'
              }`}
            >
              
              {/* MODAL HEADER WITH ROLE SWAPPER AND CLOSE ACTION */}
              <div className="h-[52px] px-5 flex items-center justify-between border-b border-slate-200 bg-slate-50 shrink-0 select-none">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4.5 h-4.5 text-blue-600 animate-spin" strokeWidth={2.5} style={{ animationDuration: '4s' }} />
                    <h3 className="text-sm font-bold text-slate-800">一季度业绩指标 · 双视角填报与审批工作流</h3>
                  </div>

                  {/* Dual Role Selector Buttons Switcher */}
                  <div className="flex items-center bg-slate-250 p-0.5 rounded-lg border border-slate-300 bg-slate-200/50">
                    <button
                      onClick={() => handleRoleChange('filler')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md flex items-center space-x-1.5 transition-all ${
                        selectedRole === 'filler'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 cursor-pointer bg-transparent'
                      }`}
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>填报者视角</span>
                    </button>
                    <button
                      onClick={() => handleRoleChange('approver')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md flex items-center space-x-1.5 transition-all ${
                        selectedRole === 'approver'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 cursor-pointer bg-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      <span>审批者视角</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[11px] text-slate-500 font-medium">您可以随时切换视角来体验双方不同的工作流限制</span>
                  <button
                    onClick={() => setIsMainModalOpen(false)}
                    className="p-1 px-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 rounded transition-all cursor-pointer"
                    title="最小化到后看板"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DYNAMIC METRIC TOOLBAR & SUB-HEADER LEGENDS */}
              <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0 select-none">
                {/* Visual Legend indicator keys to help users understand what the columns are */}
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="font-semibold text-slate-700">填报得分</span>
                    </div>
                    {selectedRole === 'approver' && (
                      <>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="font-semibold text-slate-700">最终审批得分</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    双击或点击带有虚线框的得分格子可直接进行修改。
                  </div>
                </div>

                {/* Subtitle center region and city selector dropdown indicator button */}
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-md border border-slate-200 text-xs">
                  <span className="text-slate-500">当前归属公司：</span>
                  <div className="font-bold text-blue-600 flex items-center space-x-0.5 cursor-pointer">
                    <span>福建地市一季度分公司</span>
                    <ChevronDown className="w-3 h-3 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* CORE INDICATORS TABLE WITH EXPANSIVE COLUMNS WIDTH */}
              <div className="flex-1 overflow-auto bg-white border-b border-slate-200">
                <table className="w-full min-w-[1380px] border-collapse relative select-text" style={{ borderCollapse: 'collapse' }}>
                  <thead className="bg-[#fafafa] sticky top-0 z-30 shadow-xs border-b border-slate-200 select-none">
                    <tr>
                      {/* Checkbox selector column heading for Approver */}
                      {selectedRole === 'approver' && (
                        <th className="py-3 px-2 text-center table-cell-bordered w-[45px] bg-[#fafafa]">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAllToggle}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            title="选择全部进行批量审批"
                          />
                        </th>
                      )}

                      <th className="py-3 px-4 text-left font-semibold text-slate-700 table-cell-bordered min-w-[210px] bg-[#fafafa]">
                        指标分类及名称
                      </th>
                      
                      <th className="py-3 px-2 text-center font-semibold text-slate-700 table-cell-bordered w-[80px] bg-[#fafafa]">
                        状态
                      </th>
                      
                      <th className="py-3 px-3 text-left font-semibold text-slate-700 table-cell-bordered min-w-[160px] max-w-[240px] bg-[#fafafa]">
                        审计说明附言
                      </th>

                      {/* City columns map */}
                      {CITIES.map(city => (
                        <th key={city.key} className="py-3 px-2 text-right font-semibold text-slate-700 table-cell-bordered w-[110px] bg-[#fafafa]">
                          {city.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIndicators.map(ind => {
                      const isLeaf = ind.nodeType === 'leaf';
                      const isUnapprovedLeaf = isLeaf && ind.status !== 'approved';
                      const isRejectedLeaf = isLeaf && ind.status === 'rejected';

                      // Status custom badge logic
                      let badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
                      let badgeText = '-';

                      if (isLeaf) {
                        if (ind.status === 'pending') {
                          badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                          badgeText = '待审批';
                        } else if (ind.status === 'approved') {
                          badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          badgeText = '已通过';
                        } else if (ind.status === 'rejected') {
                          badgeBg = 'bg-red-50 text-red-700 border-red-200';
                          badgeText = '已退回';
                        }
                      }

                      return (
                        <tr 
                          key={ind.id} 
                          className={`group hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${
                            isLeaf ? 'bg-white' : 'bg-slate-50/50 font-medium'
                          }`}
                        >
                          {/* Checked index box row (approver leaf nodes only) */}
                          {selectedRole === 'approver' && (
                            <td className="py-2.5 px-2 text-center table-cell-bordered align-middle">
                              {isLeaf ? (
                                <input
                                  type="checkbox"
                                  checked={selectedRowIds.has(ind.id)}
                                  disabled={ind.status === 'approved'}
                                  onChange={() => handleRowCheckboxToggle(ind.id)}
                                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          )}

                          {/* Indicator label column */}
                          <td className="py-2 px-4 table-cell-bordered text-left align-middle select-none">
                            <div className="flex items-center space-x-1">
                              {!isLeaf && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                              <span className={`text-slate-800 ${
                                isLeaf ? 'pl-4 text-xs' : 'font-bold text-xs font-display'
                              }`}>
                                {ind.name}
                              </span>
                            </div>
                          </td>

                          {/* Status Badge column */}
                          <td className="py-2 px-2 table-cell-bordered text-center align-middle select-none">
                            {isLeaf ? (
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border leading-none shadow-xs uppercase tracking-wider ${badgeBg}`}>
                                {badgeText}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-[10px]">-</span>
                            )}
                          </td>

                          {/* Audit opinion description block */}
                          <td className="py-2 px-3 table-cell-bordered align-middle">
                            <div className="relative min-h-[30px] flex items-center">
                              {editingDescId === ind.id ? (
                                <div className="flex items-center space-x-1.5 w-full">
                                  <input
                                    ref={descInputRef}
                                    type="text"
                                    value={tempDescValue}
                                    onChange={(e) => setTempDescValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveDescription(ind.id);
                                      if (e.key === 'Escape') setEditingDescId(null);
                                    }}
                                    placeholder="输入考评理由或说明..."
                                    className="bg-white border border-blue-500 text-xs rounded px-2 py-1 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium shadow-inner"
                                  />
                                  <button 
                                    onClick={() => saveDescription(ind.id)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="保存说明"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingDescId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                    title="取消修改"
                                  >
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => startEditingDescription(ind.id, ind.description)}
                                  className={`flex items-center space-x-1.5 text-xs py-1 px-2 rounded w-full border border-transparent select-none ${
                                    selectedRole === 'approver' 
                                      ? 'cursor-pointer hover:bg-slate-100/80 hover:border-slate-200 text-slate-600 group/field' 
                                      : 'text-slate-600'
                                  }`}
                                  title={selectedRole === 'approver' ? '点击可编辑此项说明' : undefined}
                                >
                                  <FileText className={`w-3.5 h-3.5 ${
                                    ind.description 
                                      ? (isRejectedLeaf ? 'text-red-500' : 'text-blue-500') 
                                      : 'text-slate-350 text-slate-400'
                                  }`} />
                                  <span className={`truncate text-xs ${
                                    ind.description 
                                      ? (isRejectedLeaf ? 'text-red-600 font-semibold' : 'text-blue-700') 
                                      : 'text-slate-400 italic'
                                  }`}>
                                    {ind.description || '点击添加备注意见...'}
                                  </span>
                                  {selectedRole === 'approver' && (
                                    <Edit2 className="w-3 h-3 text-blue-500 opacity-0 group-hover/field:opacity-100 transition-opacity shrink-0 ml-auto" />
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 9 Cities score interactive cells map */}
                          {CITIES.map(city => {
                            const score: ScoreDetail = ind.scores[city.key] || { fillerValue: 0, approverValue: 0, rank: 1 };
                            const isActiveEdit = editingScore?.indicatorId === ind.id && editingScore?.cityKey === city.key;

                            // Highlight styles for values currently modifiable by user depending on active roles:
                            // filler can edit rejected, approver can edit anything unapproved
                            const isFillerEditable = selectedRole === 'filler' && isLeaf && isRejectedLeaf;
                            const isApproverEditable = selectedRole === 'approver' && isLeaf && isUnapprovedLeaf;
                            const canEdit = isFillerEditable || isApproverEditable;

                            return (
                              <td key={city.key} className="py-1 px-2 table-cell-bordered text-right align-middle">
                                <div className="flex items-center justify-end space-x-1">
                                  
                                  {/* Dynamic content rendering */}
                                  {isActiveEdit ? (
                                    <div className="flex items-center shrink-0 w-24">
                                      <input
                                        type="text"
                                        value={tempScoreValue}
                                        onChange={(e) => setTempScoreValue(e.target.value)}
                                        onBlur={saveScore}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveScore();
                                          if (e.key === 'Escape') setEditingScore(null);
                                        }}
                                        className="bg-white border-2 border-orange-400 text-right text-xs rounded px-1.5 py-0.5 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-200 font-bold font-mono h-7"
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div 
                                      onClick={() => startEditingScore(ind.id, city.key, selectedRole === 'filler' ? score.fillerValue : score.approverValue, ind.status, ind.nodeType)}
                                      className={`flex flex-col items-end py-1 px-1.5 rounded transition-all min-w-[72px] relative ${
                                        canEdit 
                                          ? selectedRole === 'filler'
                                            ? 'cursor-text hover:bg-blue-50 border-b border-dashed border-blue-500 cell-editable cell-editable-filler'
                                            : 'cursor-text hover:bg-emerald-50 border-b border-dashed border-emerald-500 cell-editable cell-editable-approver'
                                          : 'opacity-90'
                                      }`}
                                      title={canEdit ? '双击或单击进行业绩数字修改' : undefined}
                                    >
                                      {/* Blue Filler score value is ALWAYS visible */}
                                      <div className="flex items-center justify-end space-x-1 leading-none">
                                        <span className="w-1 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                        <span className="text-xs font-bold font-mono text-blue-600 tracking-tighter">
                                          {score.fillerValue.toFixed(4)}
                                        </span>
                                      </div>

                                      {/* Green Approver score value is ONLY visible in Approver view */}
                                      {selectedRole === 'approver' && (
                                        <div className="flex items-center justify-end space-x-1 leading-none mt-1 animate-fade-in">
                                          <span className="w-1 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                          <span className="text-xs font-bold font-mono text-emerald-600 tracking-tighter">
                                            {score.approverValue.toFixed(4)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Rank marker pill box badge */}
                                  <div className="self-center">
                                    <span className={`w-[17px] h-[17px] rounded text-[10px] font-bold font-mono flex items-center justify-center border font-semibold shrink-0 select-none shadow-xs ${
                                      score.rank <= 3
                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                      {score.rank}
                                    </span>
                                  </div>

                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MODAL FOOTER CONDUIT ACTIONS & BATCH COMMANDS */}
              <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 select-none relative">
                
                {/* Approver role-only bulk trigger button commands */}
                {selectedRole === 'approver' ? (
                  <div className="flex items-center space-x-3.5 z-10 animate-fade-in">
                    <button
                      onClick={() => handleBatchActionChange('approve')}
                      disabled={selectedRowIds.size === 0}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition-colors shadow flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      <span>通过被选指标 ({selectedRowIds.size})</span>
                    </button>
                    <button
                      onClick={() => handleBatchActionChange('reject')}
                      disabled={selectedRowIds.size === 0}
                      className="px-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-300 rounded font-bold text-xs transition-colors shadow flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                      <span>退回被选重新修改 ({selectedRowIds.size})</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-medium">
                     填报说明：在填报角色下，若指标被驳回，您可以随时双击对应的地市名录评分，更新完毕后该数据将在审核视角中呈现进行二次核准。
                  </div>
                )}

                {/* Main close action button aligned directly in the bottom center */}
                <button
                  onClick={() => setIsMainModalOpen(false)}
                  className="px-8 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold shadow hover:shadow-md transition-colors absolute left-1/2 -translate-x-1/2 cursor-pointer"
                >
                  关闭
                </button>

                {/* Right metadata counter summary */}
                <div className="text-right text-[11px] text-slate-500 font-medium hidden sm:block">
                  数据一季度更新周期 | 实时连接主网
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* ============= === BATCH APPROVAL CAPTURE MODAL === ============= */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isApprovalModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-[450px] overflow-hidden border border-slate-200"
            >
              
              {/* Approval Modal Banner Title */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h4 className={`text-sm font-bold flex items-center space-x-2 ${
                  approvalAction === 'approve' ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {approvalAction === 'approve' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>
                    {approvalAction === 'approve' ? '批量核准通过' : '批量驳回整改'}
                  </span>
                </h4>
                <button onClick={() => setIsApprovalModalOpen(false)} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Approval Text Context Capture Zone */}
              <div className="p-5 space-y-4">
                
                <div className="text-xs text-slate-600 leading-relaxed font-medium">
                  {approvalAction === 'approve' ? (
                    <span>您正在批准 <strong>{selectedRowIds.size}</strong> 项业绩考核指标。所填说明将做为审批附言。</span>
                  ) : (
                    <span>您正在将 <strong>{selectedRowIds.size}</strong> 项考评驳回给各分公司重新核查。请输入具体指导意见或附件补传理由（说明为<b>必填项</b>）：</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">审批意见附言</label>
                  <textarea
                    rows={4}
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder={
                      approvalAction === 'approve' 
                        ? '请输入同意批准附言，默认为“同意。”' 
                        : '请输入被驳回的退回意见。列出具体需配合上传佐证材料的分公司及理由...'
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-inner text-slate-900"
                  />
                </div>

                {/* Quick suggestions template */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-450 block text-slate-400">快捷预设模板推荐</span>
                  <div className="flex flex-wrap gap-1.5">
                    {approvalAction === 'approve' ? (
                      ['同意。', '数据已审核一致通过。', '佐证附件均齐备已通过考核。'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setApprovalComment(t)}
                          className="bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-755 text-slate-600 rounded border border-slate-200 transition-all cursor-pointer"
                        >
                          {t}
                        </button>
                      ))
                    ) : (
                      ['数据异常，部分地市缺附件！', '得分与报表凭证不符。', '请补充一季度季度核查说明红头文件。'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setApprovalComment(t)}
                          className="bg-red-50 hover:bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-655 text-red-650 rounded border border-red-200 transition-all cursor-pointer text-red-600"
                        >
                          {t}
                        </button>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons Footer panel */}
              <div className="px-5 py-3 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50/80">
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 hover:border-slate-400 text-slate-600 rounded text-xs font-semibold bg-white transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={submitBatchApproveOrReject}
                  className={`px-6 py-1.5 text-white rounded text-xs font-bold transition-colors shadow cursor-pointer ${
                    approvalAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  确认发送
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
