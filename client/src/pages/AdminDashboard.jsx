import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getStations, getStationNodes, getStationEdges, createStation, updateStation, deleteStation, createNode, updateNode, deleteNode, createEdge, updateEdge, deleteEdge } from '../api';

function useAutoDismiss(message, setMessage) {
  useEffect(() => {
    if (!message) return;
    const isSuccess = message.toLowerCase().includes('success') || message.includes('सफल');
    const delay = isSuccess ? 5000 : 8000;
    const timer = setTimeout(() => {
      setMessage('');
    }, delay);
    return () => clearTimeout(timer);
  }, [message, setMessage]);
}

function FormBanner({ message, onDismiss, style = {} }) {
  if (!message) return null;
  const isSuccess = message.toLowerCase().includes('success') || message.includes('सफल');
  return (
    <div
      className={`form-message ${isSuccess ? 'success' : 'error'}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        ...style,
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        className="form-message-close"
        aria-label="Close"
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'currentColor',
          cursor: 'pointer',
          padding: '0.1rem 0.35rem',
          fontSize: '1.1rem',
          lineHeight: 1,
          opacity: 0.75,
          borderRadius: '3px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.75';
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stations');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editStation, setEditStation] = useState(null);
  const [formData, setFormData] = useState({ name: '', name_hi: '', city: '', code: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [stationToDelete, setStationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Nodes tab state
  const [selectedStationId, setSelectedStationId] = useState('');
  const [nodes, setNodes] = useState([]);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [nodesError, setNodesError] = useState('');
  const [showAddNodeForm, setShowAddNodeForm] = useState(false);
  const [editNode, setEditNode] = useState(null);
  const [nodeFormData, setNodeFormData] = useState({
    name: '',
    name_hi: '',
    type: '',
    floor: '',
    x: '',
    y: '',
    accessible: true,
  });
  const [nodeFormErrors, setNodeFormErrors] = useState({});
  const [nodeFormLoading, setNodeFormLoading] = useState(false);
  const [nodeFormMessage, setNodeFormMessage] = useState('');
  const [nodeToDelete, setNodeToDelete] = useState(null);
  const [deleteNodeLoading, setDeleteNodeLoading] = useState(false);

  // Edges tab state
  const [selectedEdgeStationId, setSelectedEdgeStationId] = useState('');
  const [edges, setEdges] = useState([]);
  const [edgeNodes, setEdgeNodes] = useState([]);
  const [edgeNodesMap, setEdgeNodesMap] = useState({});
  const [edgesLoading, setEdgesLoading] = useState(false);
  const [edgesError, setEdgesError] = useState('');
  const [showAddEdgeForm, setShowAddEdgeForm] = useState(false);
  const [editEdge, setEditEdge] = useState(null);
  const [edgeFormData, setEdgeFormData] = useState({
    from_node: '',
    to_node: '',
    distance: '',
    is_accessible: true,
    has_stairs: false,
  });
  const [edgeFormErrors, setEdgeFormErrors] = useState({});
  const [edgeFormLoading, setEdgeFormLoading] = useState(false);
  const [edgeFormMessage, setEdgeFormMessage] = useState('');
  const [edgeToDelete, setEdgeToDelete] = useState(null);
  const [deleteEdgeLoading, setDeleteEdgeLoading] = useState(false);

  // Auto-dismiss timers for message banners (5s success, 8s error)
  useAutoDismiss(formMessage, setFormMessage);
  useAutoDismiss(nodeFormMessage, setNodeFormMessage);
  useAutoDismiss(edgeFormMessage, setEdgeFormMessage);

  const getNodeTypeLabel = (type) => {
    if (!type) return '';
    const key = `nodeType.${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const fetchStations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getStations();
      setStations(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('admin.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stations') {
      fetchStations();
    }
  }, [activeTab]);

  useEffect(() => {
    if ((activeTab === 'nodes' || activeTab === 'edges') && stations.length === 0 && !loading) {
      fetchStations();
    }
  }, [activeTab, stations.length, loading]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = t('admin.formNameRequired');
    if (!formData.name_hi.trim()) errors.name_hi = t('admin.formNameHiRequired');
    if (!formData.city.trim()) errors.city = t('admin.formCityRequired');
    if (!formData.code.trim()) errors.code = t('admin.formCodeRequired');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    setFormData({ name: '', name_hi: '', city: '', code: '' });
    setFormErrors({});
    setFormMessage('');
    setEditStation(null);
    setShowAddForm(true);
  };

  const handleEdit = (station) => {
    setFormData({
      name: station.name || '',
      name_hi: station.name_hi || '',
      city: station.city || '',
      code: station.code || ''
    });
    setFormErrors({});
    setFormMessage('');
    setEditStation(station);
    setShowAddForm(true);
  };

  const handleDeleteClick = (station) => {
    setStationToDelete(station);
  };

  const handleCancelDelete = () => {
    if (!deleteLoading) {
      setStationToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!stationToDelete) return;
    setDeleteLoading(true);
    setFormMessage('');
    try {
      const res = await deleteStation(stationToDelete.id);
      setFormMessage(res.data?.message || t('admin.deleteSuccess'));
      setStationToDelete(null);
      await fetchStations();
    } catch (err) {
      setFormMessage(err.response?.data?.error || t('admin.deleteError'));
      setStationToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);
    setFormMessage('');
    try {
      if (editStation) {
        await updateStation(editStation.id, formData);
        setFormMessage(t('admin.formUpdateSuccess'));
      } else {
        await createStation(formData);
        setFormMessage(t('admin.formSuccess'));
      }
      setShowAddForm(false);
      setEditStation(null);
      setFormData({ name: '', name_hi: '', city: '', code: '' });
      setFormErrors({});
      await fetchStations();
    } catch (err) {
      const defaultErr = editStation ? t('admin.formUpdateError') : t('admin.formError');
      setFormMessage(err.response?.data?.error || defaultErr);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditStation(null);
    setFormData({ name: '', name_hi: '', city: '', code: '' });
    setFormErrors({});
    setFormMessage('');
  };

  const renderStationsTab = () => {
    if (loading) {
      return (
        <div className="placeholder-box">
          <span className="spinner large" />
          <p className="placeholder-text">{t('admin.loading')}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="error-message admin-error">
          <span className="error-icon">⚠️</span> {error}
        </div>
      );
    }
    return (
      <>
        <div className="admin-table-toolbar">
          <button
            id="admin-add-station-btn"
            type="button"
            className="btn-primary admin-btn-small"
            onClick={handleAddClick}
          >
            {t('admin.addStationBtn')}
          </button>
        </div>
        {formMessage && !showAddForm && (
          <FormBanner
            message={formMessage}
            onDismiss={() => setFormMessage('')}
            style={{ marginBottom: '1.25rem' }}
          />
        )}
        {showAddForm && (
          <div className="admin-form-panel glass-panel">
            <h3 className="admin-form-title">
              {editStation ? t('admin.editStationTitle') : t('admin.addStationTitle')}
            </h3>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="station-name">{t('admin.formName')}</label>
                  <input
                    id="station-name"
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('admin.formName')}
                  />
                  {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="station-name-hi">{t('admin.formNameHi')}</label>
                  <input
                    id="station-name-hi"
                    type="text"
                    className={`form-input ${formErrors.name_hi ? 'error' : ''}`}
                    value={formData.name_hi}
                    onChange={(e) => setFormData({ ...formData, name_hi: e.target.value })}
                    placeholder={t('admin.formNameHi')}
                  />
                  {formErrors.name_hi && <span className="form-error">{formErrors.name_hi}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="station-city">{t('admin.formCity')}</label>
                  <input
                    id="station-city"
                    type="text"
                    className={`form-input ${formErrors.city ? 'error' : ''}`}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t('admin.formCity')}
                  />
                  {formErrors.city && <span className="form-error">{formErrors.city}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="station-code">{t('admin.formCode')}</label>
                  <input
                    id="station-code"
                    type="text"
                    className={`form-input ${formErrors.code ? 'error' : ''}`}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder={t('admin.formCode')}
                    maxLength={5}
                  />
                  {formErrors.code && <span className="form-error">{formErrors.code}</span>}
                </div>
              </div>
              {formMessage && (
                <FormBanner
                  message={formMessage}
                  onDismiss={() => setFormMessage('')}
                />
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary admin-btn-small"
                  onClick={handleCancel}
                >
                  {t('admin.formCancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary admin-btn-small"
                  disabled={formLoading}
                >
                  {formLoading ? t('admin.formSaving') : t('admin.formSave')}
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.tableName')}</th>
                <th>{t('admin.tableNameHi')}</th>
                <th>{t('admin.tableCity')}</th>
                <th>{t('admin.tableCode')}</th>
                <th>{t('admin.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {stations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-table-empty">{t('admin.dashboardPlaceholder')}</td>
                </tr>
              ) : (
                stations.map((st) => (
                  <tr key={st.id}>
                    <td>{st.name}</td>
                    <td>{st.name_hi || '—'}</td>
                    <td>{st.city || '—'}</td>
                    <td><span className="badge code-badge">{st.code || '—'}</span></td>
                    <td className="admin-table-actions">
                      <div className="admin-actions-group">
                        <button
                          type="button"
                          className="admin-edit-btn"
                          onClick={() => handleEdit(st)}
                        >
                          {t('admin.editBtn')}
                        </button>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={() => handleDeleteClick(st)}
                        >
                          {t('admin.deleteBtn')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {stationToDelete && (
          <div className="admin-modal-overlay" onClick={handleCancelDelete}>
            <div className="admin-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <span className="admin-modal-icon">⚠️</span>
                <div>
                  <h3 className="admin-modal-title">{t('admin.deleteConfirmTitle')}</h3>
                  <div className="admin-modal-station-badge">
                    <strong>{lang === 'hi' && stationToDelete.name_hi ? stationToDelete.name_hi : stationToDelete.name}</strong>
                    {stationToDelete.code && (
                      <span className="badge code-badge" style={{ marginLeft: '0.4rem' }}>
                        {stationToDelete.code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="admin-modal-body">
                {t('admin.deleteConfirmText')}
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-secondary admin-btn-small"
                  onClick={handleCancelDelete}
                  disabled={deleteLoading}
                >
                  {t('admin.formCancel')}
                </button>
                <button
                  type="button"
                  className="btn-danger admin-btn-small"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? t('admin.deletingBtn') : t('admin.deleteBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const fetchNodes = async (stationId) => {
    setNodesLoading(true);
    setNodesError('');
    try {
      const res = await getStationNodes(stationId);
      setNodes(res.data);
    } catch (err) {
      setNodesError(err.response?.data?.error || t('admin.nodesError'));
    } finally {
      setNodesLoading(false);
    }
  };

  const handleStationChange = (e) => {
    const stationId = e.target.value;
    setSelectedStationId(stationId);
    setNodes([]);
    setNodesError('');
    setShowAddNodeForm(false);
    setEditNode(null);
    setNodeToDelete(null);
    setNodeFormData({
      name: '',
      name_hi: '',
      type: '',
      floor: '',
      x: '',
      y: '',
      accessible: true,
    });
    setNodeFormMessage('');
    setNodeFormErrors({});
    if (stationId) {
      fetchNodes(stationId);
    }
  };

  const handleAddNodeClick = () => {
    setEditNode(null);
    setNodeFormData({
      name: '',
      name_hi: '',
      type: '',
      floor: '',
      x: '',
      y: '',
      accessible: true,
    });
    setNodeFormErrors({});
    setNodeFormMessage('');
    setShowAddNodeForm(true);
  };

  const handleEditNode = (node) => {
    setEditNode(node);
    setNodeFormData({
      name: node.name || '',
      name_hi: node.name_hi || '',
      type: node.type || '',
      floor: node.floor !== undefined && node.floor !== null ? String(node.floor) : '',
      x: node.x !== undefined && node.x !== null ? String(node.x) : '',
      y: node.y !== undefined && node.y !== null ? String(node.y) : '',
      accessible: node.accessible !== undefined ? Boolean(node.accessible) : true,
    });
    setNodeFormErrors({});
    setNodeFormMessage('');
    setShowAddNodeForm(true);
  };

  const handleCancelNode = () => {
    setShowAddNodeForm(false);
    setEditNode(null);
    setNodeFormData({
      name: '',
      name_hi: '',
      type: '',
      floor: '',
      x: '',
      y: '',
      accessible: true,
    });
    setNodeFormErrors({});
    setNodeFormMessage('');
  };

  const handleDeleteNodeClick = (node) => {
    setNodeToDelete(node);
  };

  const handleCancelDeleteNode = () => {
    if (!deleteNodeLoading) {
      setNodeToDelete(null);
    }
  };

  const handleConfirmDeleteNode = async () => {
    if (!nodeToDelete) return;
    setDeleteNodeLoading(true);
    setNodeFormMessage('');
    try {
      const res = await deleteNode(nodeToDelete.id);
      setNodeFormMessage(res.data?.message || t('admin.nodeDeleteSuccess'));
      setNodeToDelete(null);
      await fetchNodes(selectedStationId);
    } catch (err) {
      setNodeFormMessage(err.response?.data?.error || t('admin.nodeDeleteError'));
      setNodeToDelete(null);
    } finally {
      setDeleteNodeLoading(false);
    }
  };

  const validateNodeForm = () => {
    const errors = {};
    if (!nodeFormData.name.trim()) {
      errors.name = t('admin.formNameRequired');
    }
    if (!nodeFormData.name_hi.trim()) {
      errors.name_hi = t('admin.formNameHiRequired');
    }
    if (!nodeFormData.type.trim()) {
      errors.type = t('admin.formTypeRequired');
    }

    const floorTrimmed = String(nodeFormData.floor).trim();
    const floorNum = Number(floorTrimmed);
    if (floorTrimmed === '' || isNaN(floorNum) || !Number.isInteger(floorNum)) {
      errors.floor = t('admin.formFloorRequired');
    }

    const xTrimmed = String(nodeFormData.x).trim();
    const xNum = Number(xTrimmed);
    if (xTrimmed === '' || isNaN(xNum)) {
      errors.x = t('admin.formXRequired');
    }

    const yTrimmed = String(nodeFormData.y).trim();
    const yNum = Number(yTrimmed);
    if (yTrimmed === '' || isNaN(yNum)) {
      errors.y = t('admin.formYRequired');
    }

    setNodeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNodeSubmit = async (e) => {
    e.preventDefault();
    if (!validateNodeForm()) return;
    setNodeFormLoading(true);
    setNodeFormMessage('');
    try {
      const payload = {
        station_id: editNode ? editNode.station_id : Number(selectedStationId),
        name: nodeFormData.name.trim(),
        name_hi: nodeFormData.name_hi.trim(),
        type: nodeFormData.type.trim(),
        floor: Number(nodeFormData.floor),
        x: Number(nodeFormData.x),
        y: Number(nodeFormData.y),
        accessible: Boolean(nodeFormData.accessible),
      };

      if (editNode) {
        await updateNode(editNode.id, payload);
        setNodeFormMessage(t('admin.nodeUpdateSuccess'));
      } else {
        await createNode(payload);
        setNodeFormMessage(t('admin.nodeCreateSuccess'));
      }

      setShowAddNodeForm(false);
      setEditNode(null);
      setNodeFormData({
        name: '',
        name_hi: '',
        type: '',
        floor: '',
        x: '',
        y: '',
        accessible: true,
      });
      setNodeFormErrors({});
      await fetchNodes(selectedStationId);
    } catch (err) {
      const defaultErr = editNode ? t('admin.nodeUpdateError') : t('admin.nodeCreateError');
      setNodeFormMessage(err.response?.data?.error || defaultErr);
    } finally {
      setNodeFormLoading(false);
    }
  };

  const renderNodesTab = () => {
    return (
      <div className="admin-nodes-tab">
        <div className="admin-table-toolbar">
          <div className="admin-select-group">
            <label htmlFor="admin-station-select" className="admin-select-label">
              {t('admin.selectStation')}
            </label>
            <select
              id="admin-station-select"
              className="form-input admin-station-select"
              value={selectedStationId}
              onChange={handleStationChange}
              disabled={loading}
            >
              <option value="">
                {loading ? t('admin.loading') : t('admin.selectStationPlaceholder')}
              </option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {lang === 'hi' && st.name_hi ? st.name_hi : st.name}
                  {st.code ? ` (${st.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedStationId && (
            <button
              id="admin-add-node-btn"
              type="button"
              className="btn-primary admin-btn-small"
              onClick={handleAddNodeClick}
            >
              {t('admin.addNodeBtn')}
            </button>
          )}
        </div>

        {nodeFormMessage && !showAddNodeForm && (
          <FormBanner
            message={nodeFormMessage}
            onDismiss={() => setNodeFormMessage('')}
            style={{ marginBottom: '1.25rem' }}
          />
        )}

        {showAddNodeForm && (
          <div className="admin-form-panel glass-panel">
            <h3 className="admin-form-title">
              {editNode ? t('admin.editNodeTitle') : t('admin.addNodeTitle')}
            </h3>
            <form onSubmit={handleNodeSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="node-name">{t('admin.formName')}</label>
                  <input
                    id="node-name"
                    type="text"
                    className={`form-input ${nodeFormErrors.name ? 'error' : ''}`}
                    value={nodeFormData.name}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, name: e.target.value })}
                    placeholder={t('admin.formName')}
                  />
                  {nodeFormErrors.name && <span className="form-error">{nodeFormErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="node-name-hi">{t('admin.formNameHi')}</label>
                  <input
                    id="node-name-hi"
                    type="text"
                    className={`form-input ${nodeFormErrors.name_hi ? 'error' : ''}`}
                    value={nodeFormData.name_hi}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, name_hi: e.target.value })}
                    placeholder={t('admin.formNameHi')}
                  />
                  {nodeFormErrors.name_hi && <span className="form-error">{nodeFormErrors.name_hi}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="node-type">{t('admin.formType')}</label>
                  <select
                    id="node-type"
                    className={`form-input admin-station-select ${nodeFormErrors.type ? 'error' : ''}`}
                    value={nodeFormData.type}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, type: e.target.value })}
                  >
                    <option value="">{t('admin.formSelectType')}</option>
                    <option value="entrance">{getNodeTypeLabel('entrance')}</option>
                    <option value="platform">{getNodeTypeLabel('platform')}</option>
                    <option value="restroom">{getNodeTypeLabel('restroom')}</option>
                    <option value="food">{getNodeTypeLabel('food')}</option>
                    <option value="helpdesk">{getNodeTypeLabel('helpdesk')}</option>
                    <option value="ticket">{getNodeTypeLabel('ticket')}</option>
                    <option value="waiting_room">{getNodeTypeLabel('waiting_room')}</option>
                    <option value="stairs">{getNodeTypeLabel('stairs')}</option>
                    <option value="lift">{getNodeTypeLabel('lift')}</option>
                    <option value="waypoint">{getNodeTypeLabel('waypoint')}</option>
                    {nodeFormData.type &&
                      ![
                        'entrance',
                        'platform',
                        'restroom',
                        'food',
                        'helpdesk',
                        'ticket',
                        'waiting_room',
                        'stairs',
                        'lift',
                        'waypoint',
                      ].includes(nodeFormData.type) && (
                        <option value={nodeFormData.type}>
                          {getNodeTypeLabel(nodeFormData.type)}
                        </option>
                      )}
                  </select>
                  {nodeFormErrors.type && <span className="form-error">{nodeFormErrors.type}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="node-floor">{t('admin.formFloor')}</label>
                  <input
                    id="node-floor"
                    type="number"
                    step="1"
                    className={`form-input ${nodeFormErrors.floor ? 'error' : ''}`}
                    value={nodeFormData.floor}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, floor: e.target.value })}
                    placeholder="0"
                  />
                  {nodeFormErrors.floor && <span className="form-error">{nodeFormErrors.floor}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="node-x">{t('admin.formX')}</label>
                  <input
                    id="node-x"
                    type="number"
                    step="any"
                    className={`form-input ${nodeFormErrors.x ? 'error' : ''}`}
                    value={nodeFormData.x}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, x: e.target.value })}
                    placeholder="100"
                  />
                  {nodeFormErrors.x && <span className="form-error">{nodeFormErrors.x}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="node-y">{t('admin.formY')}</label>
                  <input
                    id="node-y"
                    type="number"
                    step="any"
                    className={`form-input ${nodeFormErrors.y ? 'error' : ''}`}
                    value={nodeFormData.y}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, y: e.target.value })}
                    placeholder="100"
                  />
                  {nodeFormErrors.y && <span className="form-error">{nodeFormErrors.y}</span>}
                </div>
              </div>
              <div className="form-group">
                <div className="admin-checkbox-group">
                  <label className="admin-checkbox-label" htmlFor="node-accessible">
                    <input
                      id="node-accessible"
                      type="checkbox"
                      checked={nodeFormData.accessible}
                      onChange={(e) =>
                        setNodeFormData({ ...nodeFormData, accessible: e.target.checked })
                      }
                      className="admin-checkbox-input"
                    />
                    <span>{t('admin.formAccessible')}</span>
                  </label>
                </div>
              </div>
              {nodeFormMessage && (
                <FormBanner
                  message={nodeFormMessage}
                  onDismiss={() => setNodeFormMessage('')}
                />
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary admin-btn-small"
                  onClick={handleCancelNode}
                >
                  {t('admin.formCancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary admin-btn-small"
                  disabled={nodeFormLoading}
                >
                  {nodeFormLoading ? t('admin.formSaving') : t('admin.formSave')}
                </button>
              </div>
            </form>
          </div>
        )}

        {!selectedStationId && (
          <div className="placeholder-box">
            <span className="placeholder-icon">📍</span>
            <p className="placeholder-text">{t('admin.nodesSelectPrompt')}</p>
          </div>
        )}

        {selectedStationId && nodesLoading && (
          <div className="placeholder-box">
            <span className="spinner large" />
            <p className="placeholder-text">{t('admin.nodesLoading')}</p>
          </div>
        )}

        {selectedStationId && !nodesLoading && nodesError && (
          <div className="error-message admin-error">
            <span className="error-icon">⚠️</span> {nodesError}
          </div>
        )}

        {selectedStationId && !nodesLoading && !nodesError && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.tableName')}</th>
                  <th>{t('admin.tableNameHi')}</th>
                  <th>{t('admin.tableType')}</th>
                  <th>{t('admin.tableFloor')}</th>
                  <th>{t('admin.tableX')}</th>
                  <th>{t('admin.tableY')}</th>
                  <th>{t('admin.tableAccessible')}</th>
                  <th>{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {nodes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="admin-table-empty">
                      {t('admin.nodesEmpty')}
                    </td>
                  </tr>
                ) : (
                  nodes.map((node) => (
                    <tr key={node.id}>
                      <td>{node.name}</td>
                      <td>{node.name_hi || '—'}</td>
                      <td>
                        <span className="badge type-badge">{getNodeTypeLabel(node.type)}</span>
                      </td>
                      <td>{node.floor}</td>
                      <td>{node.x}</td>
                      <td>{node.y}</td>
                      <td>
                        <span
                          className={`badge ${
                            node.accessible ? 'badge-accessible-yes' : 'badge-accessible-no'
                          }`}
                        >
                          {node.accessible ? t('admin.yes') : t('admin.no')}
                        </span>
                      </td>
                      <td className="admin-table-actions">
                        <div className="admin-actions-group">
                          <button
                            type="button"
                            className="admin-edit-btn"
                            onClick={() => handleEditNode(node)}
                          >
                            {t('admin.editBtn')}
                          </button>
                          <button
                            type="button"
                            className="admin-delete-btn"
                            onClick={() => handleDeleteNodeClick(node)}
                          >
                            {t('admin.deleteBtn')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {nodeToDelete && (
          <div className="admin-modal-overlay" onClick={handleCancelDeleteNode}>
            <div className="admin-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <span className="admin-modal-icon">⚠️</span>
                <div>
                  <h3 className="admin-modal-title">{t('admin.deleteNodeConfirmTitle')}</h3>
                  <div className="admin-modal-station-badge">
                    <strong>{lang === 'hi' && nodeToDelete.name_hi ? nodeToDelete.name_hi : nodeToDelete.name}</strong>
                    {nodeToDelete.type && (
                      <span className="badge type-badge" style={{ marginLeft: '0.4rem' }}>
                        {getNodeTypeLabel(nodeToDelete.type)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="admin-modal-body">
                {t('admin.deleteNodeConfirmText')}
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-secondary admin-btn-small"
                  onClick={handleCancelDeleteNode}
                  disabled={deleteNodeLoading}
                >
                  {t('admin.formCancel')}
                </button>
                <button
                  type="button"
                  className="btn-danger admin-btn-small"
                  onClick={handleConfirmDeleteNode}
                  disabled={deleteNodeLoading}
                >
                  {deleteNodeLoading ? t('admin.deletingBtn') : t('admin.deleteBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const fetchEdges = async (stationId) => {
    setEdgesLoading(true);
    setEdgesError('');
    try {
      const [edgesRes, nodesRes] = await Promise.all([
        getStationEdges(stationId),
        getStationNodes(stationId),
      ]);
      const map = {};
      const nodesList = Array.isArray(nodesRes.data) ? nodesRes.data : [];
      nodesList.forEach((n) => {
        map[n.id] = n;
      });
      setEdgeNodes(nodesList);
      setEdgeNodesMap(map);
      setEdges(Array.isArray(edgesRes.data) ? edgesRes.data : []);
    } catch (err) {
      setEdgesError(err.response?.data?.error || t('admin.edgesError'));
    } finally {
      setEdgesLoading(false);
    }
  };

  const handleEdgeStationChange = (e) => {
    const stationId = e.target.value;
    setSelectedEdgeStationId(stationId);
    setEdges([]);
    setEdgeNodes([]);
    setEdgeNodesMap({});
    setEdgesError('');
    setShowAddEdgeForm(false);
    setEditEdge(null);
    setEdgeToDelete(null);
    setEdgeFormData({
      from_node: '',
      to_node: '',
      distance: '',
      is_accessible: true,
      has_stairs: false,
    });
    setEdgeFormErrors({});
    setEdgeFormMessage('');
    if (stationId) {
      fetchEdges(stationId);
    }
  };

  const handleAddEdgeClick = () => {
    setEditEdge(null);
    setEdgeFormData({
      from_node: '',
      to_node: '',
      distance: '',
      is_accessible: true,
      has_stairs: false,
    });
    setEdgeFormErrors({});
    setEdgeFormMessage('');
    setShowAddEdgeForm(true);
  };

  const handleEditEdge = (edge) => {
    setEditEdge(edge);
    setEdgeFormData({
      from_node: String(edge.from_node),
      to_node: String(edge.to_node),
      distance: edge.distance !== undefined && edge.distance !== null ? String(edge.distance) : '',
      is_accessible: edge.is_accessible !== undefined ? Boolean(edge.is_accessible) : true,
      has_stairs: edge.has_stairs !== undefined ? Boolean(edge.has_stairs) : false,
    });
    setEdgeFormErrors({});
    setEdgeFormMessage('');
    setShowAddEdgeForm(true);
  };

  const handleCancelEdge = () => {
    setShowAddEdgeForm(false);
    setEditEdge(null);
    setEdgeFormData({
      from_node: '',
      to_node: '',
      distance: '',
      is_accessible: true,
      has_stairs: false,
    });
    setEdgeFormErrors({});
    setEdgeFormMessage('');
  };

  const handleDeleteEdgeClick = (edge) => {
    setEdgeToDelete(edge);
  };

  const handleCancelDeleteEdge = () => {
    if (!deleteEdgeLoading) {
      setEdgeToDelete(null);
    }
  };

  const handleConfirmDeleteEdge = async () => {
    if (!edgeToDelete) return;
    setDeleteEdgeLoading(true);
    setEdgeFormMessage('');
    try {
      await deleteEdge(edgeToDelete.id);
      setEdgeFormMessage(t('admin.edgeDeleteSuccess'));
      await fetchEdges(selectedEdgeStationId);
      setEdgeToDelete(null);
    } catch (err) {
      setEdgeFormMessage(err.response?.data?.error || t('admin.edgeDeleteError'));
      setEdgeToDelete(null);
    } finally {
      setDeleteEdgeLoading(false);
    }
  };

  const validateEdgeForm = () => {
    const errors = {};

    const distTrimmed = String(edgeFormData.distance).trim();
    const distNum = Number(distTrimmed);
    if (distTrimmed === '' || isNaN(distNum) || distNum <= 0) {
      errors.distance = t('admin.formDistanceRequired');
    }

    if (!editEdge) {
      if (!edgeFormData.from_node) {
        errors.from_node = t('admin.formFromNodeRequired');
      }
      if (!edgeFormData.to_node) {
        errors.to_node = t('admin.formToNodeRequired');
      }

      if (
        edgeFormData.from_node &&
        edgeFormData.to_node &&
        String(edgeFormData.from_node) === String(edgeFormData.to_node)
      ) {
        errors.to_node = t('admin.formSameNodeError');
      }

      if (
        edgeFormData.from_node &&
        edgeFormData.to_node &&
        String(edgeFormData.from_node) !== String(edgeFormData.to_node)
      ) {
        const fromId = Number(edgeFormData.from_node);
        const toId = Number(edgeFormData.to_node);
        const alreadyExists = edges.some(
          (e) =>
            (e.from_node === fromId && e.to_node === toId) ||
            (e.from_node === toId && e.to_node === fromId)
        );
        if (alreadyExists) {
          errors.to_node = t('admin.formEdgeExistsError');
        }
      }
    }

    setEdgeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdgeSubmit = async (e) => {
    e.preventDefault();
    if (!validateEdgeForm()) return;
    setEdgeFormLoading(true);
    setEdgeFormMessage('');
    try {
      if (editEdge) {
        const payload = {
          distance: Number(edgeFormData.distance),
          is_accessible: Boolean(edgeFormData.is_accessible),
          has_stairs: Boolean(edgeFormData.has_stairs),
        };
        await updateEdge(editEdge.id, payload);
        setEdgeFormMessage(t('admin.edgeUpdateSuccess'));
      } else {
        const payload = {
          station_id: Number(selectedEdgeStationId),
          from_node: Number(edgeFormData.from_node),
          to_node: Number(edgeFormData.to_node),
          distance: Number(edgeFormData.distance),
          is_accessible: Boolean(edgeFormData.is_accessible),
          has_stairs: Boolean(edgeFormData.has_stairs),
        };
        await createEdge(payload);
        setEdgeFormMessage(t('admin.edgeCreateSuccess'));
      }

      setShowAddEdgeForm(false);
      setEditEdge(null);
      setEdgeFormData({
        from_node: '',
        to_node: '',
        distance: '',
        is_accessible: true,
        has_stairs: false,
      });
      setEdgeFormErrors({});
      await fetchEdges(selectedEdgeStationId);
    } catch (err) {
      const defaultErr = editEdge ? t('admin.edgeUpdateError') : t('admin.edgeCreateError');
      setEdgeFormMessage(err.response?.data?.error || defaultErr);
    } finally {
      setEdgeFormLoading(false);
    }
  };

  const renderEdgeNodeName = (nodeId) => {
    const node = edgeNodesMap[nodeId];
    const name = node ? (lang === 'hi' && node.name_hi ? node.name_hi : node.name) : null;
    if (name && name.trim()) {
      return name;
    }
    return (
      <span className="node-missing-name">
        — <small className="id-suffix">#{nodeId}</small>
      </span>
    );
  };

  const renderEdgesTab = () => {
    return (
      <div className="admin-nodes-tab">
        <div className="admin-table-toolbar">
          <div className="admin-select-group">
            <label htmlFor="admin-edge-station-select" className="admin-select-label">
              {t('admin.selectStation')}
            </label>
            <select
              id="admin-edge-station-select"
              className="form-input admin-station-select"
              value={selectedEdgeStationId}
              onChange={handleEdgeStationChange}
            >
              <option value="">
                {loading ? t('admin.loading') : t('admin.selectStationPlaceholder')}
              </option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {lang === 'hi' && st.name_hi ? st.name_hi : st.name}
                  {st.code ? ` (${st.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedEdgeStationId && (
            <button
              id="admin-add-edge-btn"
              type="button"
              className="btn-primary admin-btn-small"
              onClick={handleAddEdgeClick}
            >
              {t('admin.addEdgeBtn')}
            </button>
          )}
        </div>

        {edgeFormMessage && !showAddEdgeForm && (
          <FormBanner
            message={edgeFormMessage}
            onDismiss={() => setEdgeFormMessage('')}
            style={{ marginBottom: '1.25rem' }}
          />
        )}

        {showAddEdgeForm && (
          <div className="admin-form-panel glass-panel">
            <h3 className="admin-form-title">
              {editEdge ? t('admin.editEdgeTitle') : t('admin.addEdgeTitle')}
            </h3>
            <form onSubmit={handleEdgeSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edge-from-node">{t('admin.formFromNode')}</label>
                  <select
                    id="edge-from-node"
                    className={`form-input admin-station-select ${
                      edgeFormErrors.from_node ? 'error' : ''
                    }`}
                    value={edgeFormData.from_node}
                    onChange={(e) =>
                      setEdgeFormData({ ...edgeFormData, from_node: e.target.value })
                    }
                    disabled={Boolean(editEdge)}
                  >
                    <option value="">{t('admin.formSelectFromNode')}</option>
                    {edgeNodes.map((n) => {
                      const name = lang === 'hi' && n.name_hi ? n.name_hi : n.name;
                      return (
                        <option key={n.id} value={n.id}>
                          {name} ({n.type})
                        </option>
                      );
                    })}
                  </select>
                  {edgeFormErrors.from_node && (
                    <span className="form-error">{edgeFormErrors.from_node}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edge-to-node">{t('admin.formToNode')}</label>
                  <select
                    id="edge-to-node"
                    className={`form-input admin-station-select ${
                      edgeFormErrors.to_node ? 'error' : ''
                    }`}
                    value={edgeFormData.to_node}
                    onChange={(e) => setEdgeFormData({ ...edgeFormData, to_node: e.target.value })}
                    disabled={Boolean(editEdge)}
                  >
                    <option value="">{t('admin.formSelectToNode')}</option>
                    {edgeNodes.map((n) => {
                      const name = lang === 'hi' && n.name_hi ? n.name_hi : n.name;
                      return (
                        <option key={n.id} value={n.id}>
                          {name} ({n.type})
                        </option>
                      );
                    })}
                  </select>
                  {edgeFormErrors.to_node && (
                    <span className="form-error">{edgeFormErrors.to_node}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edge-distance">{t('admin.formDistance')}</label>
                  <input
                    id="edge-distance"
                    type="number"
                    step="any"
                    min="0.1"
                    className={`form-input ${edgeFormErrors.distance ? 'error' : ''}`}
                    value={edgeFormData.distance}
                    onChange={(e) =>
                      setEdgeFormData({ ...edgeFormData, distance: e.target.value })
                    }
                    placeholder="20"
                  />
                  {edgeFormErrors.distance && (
                    <span className="form-error">{edgeFormErrors.distance}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <div className="admin-checkbox-group">
                    <label className="admin-checkbox-label" htmlFor="edge-accessible">
                      <input
                        id="edge-accessible"
                        type="checkbox"
                        checked={edgeFormData.is_accessible}
                        onChange={(e) =>
                          setEdgeFormData({ ...edgeFormData, is_accessible: e.target.checked })
                        }
                        className="admin-checkbox-input"
                      />
                      <span>{t('admin.formAccessible')}</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <div className="admin-checkbox-group">
                    <label className="admin-checkbox-label" htmlFor="edge-has-stairs">
                      <input
                        id="edge-has-stairs"
                        type="checkbox"
                        checked={edgeFormData.has_stairs}
                        onChange={(e) =>
                          setEdgeFormData({ ...edgeFormData, has_stairs: e.target.checked })
                        }
                        className="admin-checkbox-input"
                      />
                      <span>{t('admin.formHasStairs')}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="admin-form-hint">
                <span>ℹ️</span>
                <span>
                  {editEdge
                    ? t('admin.reverseEdgeUpdateNotice')
                    : t('admin.reverseEdgeNotice')}
                </span>
              </div>

              {edgeFormMessage && (
                <FormBanner
                  message={edgeFormMessage}
                  onDismiss={() => setEdgeFormMessage('')}
                />
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary admin-btn-small"
                  onClick={handleCancelEdge}
                >
                  {t('admin.formCancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary admin-btn-small"
                  disabled={edgeFormLoading}
                >
                  {edgeFormLoading ? t('admin.formSaving') : t('admin.formSave')}
                </button>
              </div>
            </form>
          </div>
        )}

        {!selectedEdgeStationId && (
          <div className="placeholder-box">
            <span className="placeholder-icon">🔗</span>
            <p className="placeholder-text">{t('admin.edgesSelectPrompt')}</p>
          </div>
        )}

        {selectedEdgeStationId && edgesLoading && (
          <div className="placeholder-box">
            <span className="spinner large" />
            <p className="placeholder-text">{t('admin.edgesLoading')}</p>
          </div>
        )}

        {selectedEdgeStationId && !edgesLoading && edgesError && (
          <div className="error-message admin-error">
            <span className="error-icon">⚠️</span> {edgesError}
          </div>
        )}

        {selectedEdgeStationId && !edgesLoading && !edgesError && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.tableId')}</th>
                  <th>{t('admin.tableFrom')}</th>
                  <th>{t('admin.tableTo')}</th>
                  <th>{t('admin.tableDistance')}</th>
                  <th>{t('admin.tableAccessible')}</th>
                  <th>{t('admin.tableHasStairs')}</th>
                  <th>{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {edges.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      {t('admin.edgesEmpty')}
                    </td>
                  </tr>
                ) : (
                  edges.map((edge) => (
                    <tr key={edge.id}>
                      <td>
                        <span className="badge code-badge">#{edge.id}</span>
                      </td>
                      <td>{renderEdgeNodeName(edge.from_node)}</td>
                      <td>{renderEdgeNodeName(edge.to_node)}</td>
                      <td>{edge.distance}</td>
                      <td>
                        <span
                          className={`badge ${
                            edge.is_accessible ? 'badge-accessible-yes' : 'badge-accessible-no'
                          }`}
                        >
                          {edge.is_accessible ? t('admin.yes') : t('admin.no')}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            edge.has_stairs ? 'badge-stairs-yes' : 'badge-stairs-no'
                          }`}
                        >
                          {edge.has_stairs ? t('admin.yes') : t('admin.no')}
                        </span>
                      </td>
                      <td className="admin-table-actions">
                        <div className="admin-actions-group">
                          <button
                            type="button"
                            className="admin-edit-btn"
                            onClick={() => handleEditEdge(edge)}
                          >
                            {t('admin.editBtn')}
                          </button>
                          <button
                            type="button"
                            className="admin-delete-btn"
                            onClick={() => handleDeleteEdgeClick(edge)}
                          >
                            {t('admin.deleteBtn')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {edgeToDelete && (
          <div className="admin-modal-overlay" onClick={handleCancelDeleteEdge}>
            <div className="admin-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <span className="admin-modal-icon">⚠️</span>
                <div>
                  <h3 className="admin-modal-title">{t('admin.deleteEdgeConfirmTitle')}</h3>
                  <div className="admin-modal-station-badge">
                    <strong>{renderEdgeNodeName(edgeToDelete.from_node)}</strong>
                    <span style={{ margin: '0 0.35rem', opacity: 0.7 }}>→</span>
                    <strong>{renderEdgeNodeName(edgeToDelete.to_node)}</strong>
                  </div>
                </div>
              </div>
              <p className="admin-modal-body">
                {t('admin.deleteEdgeConfirmText')}
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-secondary admin-btn-small"
                  onClick={handleCancelDeleteEdge}
                  disabled={deleteEdgeLoading}
                >
                  {t('admin.formCancel')}
                </button>
                <button
                  type="button"
                  className="btn-danger admin-btn-small"
                  onClick={handleConfirmDeleteEdge}
                  disabled={deleteEdgeLoading}
                >
                  {deleteEdgeLoading ? t('admin.deletingBtn') : t('admin.deleteBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabContent = {
    stations: renderStationsTab(),
    nodes: renderNodesTab(),
    edges: renderEdgesTab(),
  };

  return (
    <div className="admin-page-container">
      <div className="admin-dashboard-card glass-panel">
        <div className="admin-dashboard-header">
          <div className="admin-header-left">
            <span className="admin-badge">🛠️</span>
            <div>
              <h1 className="admin-title gradient-text">{t('admin.dashboardTitle')}</h1>
              <p className="admin-subtitle">{t('admin.dashboardSubtitle')}</p>
            </div>
          </div>

          <div className="admin-header-actions">
            <button
              id="admin-logout-btn"
              type="button"
              className="btn-danger admin-btn-small"
              onClick={handleLogout}
            >
              {t('admin.logoutBtn')}
            </button>
          </div>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'stations' ? 'active' : ''}`}
            onClick={() => setActiveTab('stations')}
          >
            {t('admin.tabStations')}
          </button>
          <button
            className={`admin-tab ${activeTab === 'nodes' ? 'active' : ''}`}
            onClick={() => setActiveTab('nodes')}
          >
            {t('admin.tabNodes')}
          </button>
          <button
            className={`admin-tab ${activeTab === 'edges' ? 'active' : ''}`}
            onClick={() => setActiveTab('edges')}
          >
            {t('admin.tabEdges')}
          </button>
        </div>

        <div className="admin-dashboard-body">
          {tabContent[activeTab]}
        </div>

        <div className="admin-dashboard-footer">
          <Link to="/" className="btn-secondary admin-btn-small">
            {t('nav.backToStations')}
          </Link>
        </div>
      </div>
    </div>
  );
}
