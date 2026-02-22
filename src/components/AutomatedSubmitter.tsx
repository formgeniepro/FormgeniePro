import React, { useState, useRef } from 'react';
import { ParsedForm, QuestionType } from '../types';
import { Play, Square, AlertCircle, CheckCircle, Activity, CreditCard } from 'lucide-react';
import { creditsApi, automationLogsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AutomatedSubmitterProps {
  form: ParsedForm;
  answers: Record<string, any>;
  validateForm: () => boolean;
}

interface LogEntry {
  id: number;
  status: 'success' | 'error' | 'info' | 'stopped';
  message: string;
  time: string;
}

export const AutomatedSubmitter: React.FC<AutomatedSubmitterProps> = ({ form, answers, validateForm }) => {
  const { user, refreshCredits } = useAuth();
  const [targetCount, setTargetCount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const stopRequested = useRef(false);
  const logCounter = useRef(0);

  const addLog = (status: 'success' | 'error' | 'info' | 'stopped', message: string) => {
    logCounter.current++;
    const id = logCounter.current;
    setLogs(prev => [{ id, status, message, time: new Date().toLocaleTimeString() }, ...prev]);
    return id;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generateFormData = () => {
    const formData = new URLSearchParams();
    form.items.forEach(item => {
      const answer = answers[item.id];
      if (answer === undefined || answer === null || answer === '') return;
      if (item.type === QuestionType.MULTIPLE_CHOICE_GRID || item.type === QuestionType.CHECKBOX_GRID) {
        if (item.rows) {
          const gridAnswers = answer as Record<string, string | string[]>;
          item.rows.forEach(row => {
            const key = row.id || row.label;
            const rowAnswer = gridAnswers[key];
            if (row.id && rowAnswer) {
              if (Array.isArray(rowAnswer)) {
                rowAnswer.forEach(val => formData.append(`entry.${row.id}`, val));
              } else {
                formData.append(`entry.${row.id}`, rowAnswer);
              }
            }
          });
        }
      } else if (item.submissionId) {
        if (Array.isArray(answer)) {
          answer.forEach(val => formData.append(`entry.${item.submissionId}`, val));
        } else {
          formData.append(`entry.${item.submissionId}`, answer.toString());
        }
      }
    });
    return formData;
  };

  const handleStart = async () => {
    if (isSubmitting || !validateForm()) return;
    if (!form.actionUrl) {
      alert("Error: Cannot submit. Form action URL missing.");
      return;
    }
    setIsSubmitting(true);
    stopRequested.current = false;
    setLogs([]);
    setProgress(0);
    logCounter.current = 0;
    addLog('info', "Starting automated submission sequence...");
    await delay(800);

    // Log this automation batch to Google Sheets
    try {
      await automationLogsApi.log(targetCount);
    } catch (e) {
      // Non-blocking — don't halt automation if logging fails
    }

    let successCount = 0;
    let pendingDeductions = 0;

    const performDeduction = async (count: number) => {
      if (user?.role === 'admin') return;
      try {
        const result = await creditsApi.deduct(count);
        addLog('success', `💳 ${count} credits deducted incrementally. Balance: ${result.credits}`);
        refreshCredits();
      } catch (err: any) {
        addLog('error', `Incremental credit deduction failed: ${err.error || 'Unknown error'}`);
      }
    };

    for (let i = 1; i <= targetCount; i++) {
      if (stopRequested.current) {
        setLogs(prev => [{ id: i, status: 'stopped', message: "Stopped by user", time: new Date().toLocaleTimeString() }, ...prev]);
        break;
      }
      try {
        const body = generateFormData();
        await fetch(form.actionUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        });
        await delay(500);
        addLog('success', `Submission #${i} finalized successfully`);
        successCount++;
        pendingDeductions++;
        if (pendingDeductions === 5) {
          await performDeduction(5);
          pendingDeductions = 0;
        }
      } catch (error) {
        addLog('error', `Submission #${i} failed: Network error`);
      }
      setProgress(i);
      if (i < targetCount && !stopRequested.current) {
        await delay(2000);
      }
    }
    if (pendingDeductions > 0) {
      await performDeduction(pendingDeductions);
    }
    await delay(500);
    setIsSubmitting(false);
  };

  const handleStop = () => {
    stopRequested.current = true;
  };

  return (
    <div className="as-container">
      <div className="as-header">
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center' }}>
          <Activity style={{ width: 20, height: 20, marginRight: '8px', color: '#7c3aed' }} />
          Automated Submission
        </h3>
        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#5b21b6', background: '#faf5ff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ede9fe' }}>
          Interval: 2.0s
        </div>
      </div>

      <div className="as-form-row">
        <div style={{ flex: 1, width: '100%' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Total Submissions
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={targetCount}
            onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
            disabled={isSubmitting}
            className="as-input"
          />
        </div>
        <div style={{ flexShrink: 0 }}>
          {!isSubmitting ? (
            <button onClick={handleStart} className="as-btn-start">
              <Play style={{ width: 16, height: 16, marginRight: '8px' }} fill="currentColor" />
              START
            </button>
          ) : (
            <button onClick={handleStop} className="as-btn-stop">
              <Square style={{ width: 16, height: 16, marginRight: '8px' }} fill="currentColor" />
              STOP
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isSubmitting && (
        <div className="as-progress-track">
          <div
            className="as-progress-fill"
            style={{ width: `${(progress / targetCount) * 100}%` }}
          />
        </div>
      )}

      {/* Logs */}
      <div className="as-log-container">
        <div className="as-log-header">
          <span>Activity Log</span>
          {logs.length > 0 && <span style={{ fontWeight: 400, color: '#9ca3af' }}>{logs.length} entries</span>}
        </div>
        <div className="as-log-body">
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', padding: '2rem', fontStyle: 'italic' }}>
              Waiting to start...
            </div>
          ) : (
            <div>
              {logs.map((log) => (
                <div key={log.id} className="as-log-entry" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', color: '#9ca3af', width: '40px', fontSize: '12px' }}>#{log.id}</span>
                    {log.status === 'success' && <CheckCircle style={{ width: 16, height: 16, color: '#22c55e', marginRight: '8px', flexShrink: 0 }} />}
                    {log.status === 'error' && <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', marginRight: '8px', flexShrink: 0 }} />}
                    {log.status === 'stopped' && <Square style={{ width: 12, height: 12, color: '#f87171', marginRight: '8px', flexShrink: 0 }} />}
                    <span style={{ fontWeight: 500, color: log.status === 'success' ? '#374151' : '#dc2626' }}>
                      {log.message}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', marginLeft: '1rem' }}>
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};