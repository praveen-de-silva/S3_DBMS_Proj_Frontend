import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Agent {
  employee_id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  nic: string;
  gender: string;
  date_of_birth: string;
  branch_id: string;
  contact_id: string;
  created_at: string;
  contact_no_1?: string;
  email?: string;
  address?: string;
}

interface AgentPerformance {
  employee_id: string;
  total_transactions: number;
  total_volume: number;
  customers_registered: number;
  accounts_created: number;
  last_activity: string;
}

const TeamManagement: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<{ [key: string]: AgentPerformance }>({});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents' | 'details'>('agents');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/manager/team/agents', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAgents(response.data.agents);
      setAgentPerformance(response.data.performance);
    } catch (error: any) {
      console.error('Failed to fetch agents:', error);
      alert('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setActiveTab('details');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPerformanceBadge = (transactions: number) => {
    if (transactions >= 50) return 'performance-high';
    if (transactions >= 20) return 'performance-medium';
    return 'performance-low';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="team-management">
      <div className="section-header">
        <div>
          <h4>Team Management</h4>
          <p className="section-subtitle">Manage your agents and monitor their performance</p>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={fetchAgents}
        >
          Refresh
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          👥 All Agents
        </button>
        {selectedAgent && (
          <button 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Agent Details
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'agents' && (
          <div className="agents-grid">
            {agents.length === 0 ? (
              <div className="no-data">
                <div className="no-data-icon">👥</div>
                <h5>No Agents Found</h5>
                <p>There are no agents assigned to your branch.</p>
              </div>
            ) : (
              agents.map(agent => {
                const performance = agentPerformance[agent.employee_id];
                return (
                  <div key={agent.employee_id} className="agent-card">
                    <div className="agent-header">
                      <div className="agent-avatar">
                        {agent.first_name.charAt(0)}{agent.last_name.charAt(0)}
                      </div>
                      <div className="agent-info">
                        <h4>{agent.first_name} {agent.last_name}</h4>
                        <span className="agent-id">{agent.employee_id}</span>
                      </div>
                      <span className={`performance-badge ${getPerformanceBadge(performance?.total_transactions || 0)}`}>
                        {performance?.total_transactions || 0} TX
                      </span>
                    </div>
                    
                    <div className="agent-stats">
                      <div className="stat">
                        <span className="stat-label">Transactions</span>
                        <span className="stat-value">{performance?.total_transactions || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Volume</span>
                        <span className="stat-value">{formatCurrency(performance?.total_volume || 0)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Accounts</span>
                        <span className="stat-value">{performance?.accounts_created || 0}</span>
                      </div>
                    </div>

                    <div className="agent-contact">
                      <span className="contact-info">📞 {agent.contact_no_1 || 'N/A'}</span>
                      <span className="contact-info">✉️ {agent.email || 'N/A'}</span>
                    </div>

                    <div className="agent-actions">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAgentSelect(agent)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'details' && selectedAgent && (
          <AgentDetails 
            agent={selectedAgent} 
            performance={agentPerformance[selectedAgent.employee_id]} 
            onBack={() => setActiveTab('agents')}
          />
        )}
      </div>
    </div>
  );
};

// Agent Details Component
interface AgentDetailsProps {
  agent: Agent;
  performance?: AgentPerformance;
  onBack: () => void;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({ agent, performance, onBack }) => {
  const [agentTransactions, setAgentTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    fetchAgentTransactions();
  }, [agent.employee_id]);

  const fetchAgentTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/manager/team/agents/${agent.employee_id}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAgentTransactions(response.data.transactions);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="agent-details">
      <div className="details-header">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Team
        </button>
        <h4>Agent Details: {agent.first_name} {agent.last_name}</h4>
      </div>

      <div className="details-content">
        <div className="details-grid">
          <div className="detail-section">
            <h5>Personal Information</h5>
            <div className="detail-row">
              <span className="detail-label">Employee ID:</span>
              <span className="detail-value">{agent.employee_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{agent.first_name} {agent.last_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">NIC:</span>
              <span className="detail-value">{agent.nic}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Gender:</span>
              <span className="detail-value">{agent.gender}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date of Birth:</span>
              <span className="detail-value">{formatDate(agent.date_of_birth)}</span>
            </div>
          </div>

          <div className="detail-section">
            <h5>Contact Information</h5>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{agent.contact_no_1 || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{agent.email || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{agent.address || 'N/A'}</span>
            </div>
          </div>

          {performance && (
            <div className="detail-section">
              <h5>Performance Summary</h5>
              <div className="detail-row">
                <span className="detail-label">Total Transactions:</span>
                <span className="detail-value">{performance.total_transactions}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Transaction Volume:</span>
                <span className="detail-value">{formatCurrency(performance.total_volume)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Customers Registered:</span>
                <span className="detail-value">{performance.customers_registered}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Accounts Created:</span>
                <span className="detail-value">{performance.accounts_created}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Activity:</span>
                <span className="detail-value">{formatDateTime(performance.last_activity)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="transactions-section">
          <div className="section-header">
            <h5>Recent Transactions</h5>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={fetchAgentTransactions}
              disabled={isLoadingTransactions}
            >
              {isLoadingTransactions ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {isLoadingTransactions ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading transactions...</p>
            </div>
          ) : agentTransactions.length === 0 ? (
            <div className="no-data">
              <p>No transactions found for this agent.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {agentTransactions.map(transaction => (
                    <tr key={transaction.transaction_id}>
                      <td>{transaction.transaction_id}</td>
                      <td>
                        <span className={`transaction-type ${transaction.transaction_type.toLowerCase()}`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className={`amount ${transaction.transaction_type.toLowerCase()}`}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>{transaction.account_id}</td>
                      <td className="description">{transaction.description}</td>
                      <td>{formatDateTime(transaction.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;