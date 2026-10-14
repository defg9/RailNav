import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MapViewer from '../components/MapViewer';
import RoutePanel from '../components/RoutePanel';
import { getStationById, getStationNodes, getStationEdges, getRoute, getNearest } from '../api';
import { useLang } from '../context/LangContext';

export default function StationPage() {
  const { id } = useParams();
  const { t }  = useLang();

  const [station, setStation]   = useState(null);
  const [nodes, setNodes]       = useState([]);
  const [edges, setEdges]       = useState([]);
  const [floor, setFloor]       = useState(0);
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError]       = useState('');
  const [activeStep, setActiveStep]   = useState(-1);

  // Load station + map data
  useEffect(() => {
    setPageLoading(true);
    setError('');
    setRouteResult(null);
    setActiveStep(-1);

    Promise.all([
      getStationById(id),
      getStationNodes(id),
      getStationEdges(id),
    ])
      .then(([stRes, nodesRes, edgesRes]) => {
        const st = stRes.data;
        setStation(st);
        // Publish to Navbar bridge
        window.__railnavStation = st;

        setNodes(nodesRes.data);
        setEdges(edgesRes.data);
        const floors = [...new Set(nodesRes.data.map(n => n.floor))].sort((a, b) => a - b);
        if (floors.length > 0) setFloor(floors[0]);
      })
      .catch(() => setError(t('panel.errors.loadFailed')))
      .finally(() => setPageLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync floor with active direction step
  useEffect(() => {
    if (activeStep >= 0 && routeResult?.path?.[activeStep]) {
      setFloor(routeResult.path[activeStep].floor);
    }
  }, [activeStep, routeResult]);

  const handleFindRoute = async (from, to, accessible) => {
    setLoading(true);
    setError('');
    setRouteResult(null);
    setActiveStep(-1);
    try {
      const res = await getRoute({ station_id: id, from, to, accessible });
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setRouteResult(res.data);
        const startNode = nodes.find(n => n.id === parseInt(from));
        if (startNode) setFloor(startNode.floor);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('panel.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleNearest = async (from, type, accessible) => {
    setLoading(true);
    setError('');
    setRouteResult(null);
    setActiveStep(-1);
    try {
      const res = await getNearest({ station_id: id, from, type, accessible });
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setRouteResult(res.data);
        const startNode = nodes.find(n => n.id === parseInt(from));
        if (startNode) setFloor(startNode.floor);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('panel.errors.nearestFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="page-loading">
        <span className="spinner large" />
        <p>{t('home.loading')}</p>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="page-error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="station-page">
      <div className="station-content">
        {/* Left panel */}
        <aside className="panel-container">
          <RoutePanel
            nodes={nodes}
            onFindRoute={handleFindRoute}
            onNearest={handleNearest}
            routeResult={routeResult}
            loading={loading}
            error={error}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        </aside>

        {/* Map */}
        <main className="map-wrapper">
          <MapViewer
            nodes={nodes}
            edges={edges}
            floor={floor}
            setFloor={setFloor}
            routePath={routeResult?.path}
            activeStepIndex={activeStep}
          />
        </main>
      </div>
    </div>
  );
}
