import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowLeft, Camera, Check, ChevronDown, Compass, Flame, Footprints, Leaf, LocateFixed, MapPin, RefreshCw, Sparkles, Sun, X } from 'lucide-react';
import { missionCategories, generateMission } from '../shared/missions.js';
import { completeMission, listMissions, saveReadyMission, summarizeMissions } from './db.js';
import { getMission } from './localMission.js';

const durations = [{ value: 'easy', label: '5 min' }, { value: 'steady', label: '10 min' }, { value: 'wander', label: '15 min' }];

function App() {
  const [mission, setMission] = useState(() => generateMission());
  const [category, setCategory] = useState('any');
  const [difficulty, setDifficulty] = useState('steady');
  const [stats, setStats] = useState({ completedCount: 0, placesNoted: 0, streak: 0 });
  const [recentMissions, setRecentMissions] = useState([]);
  const [source, setSource] = useState('offline');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isZen, setIsZen] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('not-requested');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notice, setNotice] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    let active = true;
    listMissions().then((saved) => {
      if (!active) return;
      const ready = saved.find((entry) => entry.status === 'ready');
      if (ready) setMission(ready);
      setRecentMissions(saved.filter((entry) => entry.status === 'completed').slice(0, 3));
      setStats(summarizeMissions(saved));
    }).catch(() => setNotice('Local storage is unavailable in this browser.'));
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { active = false; window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => { if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream; }, [cameraStream, cameraOpen]);
  useEffect(() => {
    if (!photo) { setPhotoUrl(''); return undefined; }
    const url = URL.createObjectURL(photo); setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => () => cameraStream?.getTracks().forEach((track) => track.stop()), [cameraStream]);

  async function refreshLocalData() {
    const saved = await listMissions();
    setRecentMissions(saved.filter((entry) => entry.status === 'completed').slice(0, 3));
    setStats(summarizeMissions(saved));
  }
  async function createNewMission() {
    setIsGenerating(true); setNotice(''); setPhoto(null); setLocation(null); setLocationStatus('not-requested');
    try {
      const result = await getMission({ category, difficulty });
      await saveReadyMission(result.mission); setMission(result.mission); setSource(result.source);
    } catch { setNotice('Could not save this mission locally. Check browser storage settings.'); }
    finally { setIsGenerating(false); }
  }
  function requestLocation() {
    if (!('geolocation' in navigator)) { setLocationStatus('unavailable'); setNotice('Location is not available in this browser.'); return; }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: Math.round(coords.accuracy) });
      setLocationStatus('saved'); setNotice('Location ready to save with this mission.');
    }, () => { setLocationStatus('denied'); setNotice('Location was not shared. You can still complete the mission.'); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }
  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { setNotice('Camera access requires a secure browser context and camera support.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      setCameraStream(stream); setCameraOpen(true); setNotice('');
    } catch { setNotice('Camera was not available or permission was declined.'); }
  }
  function closeCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop()); setCameraStream(null); setCameraOpen(false);
  }
  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas'); const scale = Math.min(1, 1280 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => { if (blob) { setPhoto(blob); closeCamera(); setNotice('Photo held locally until you complete this mission.'); } }, 'image/jpeg', 0.82);
  }
  async function finishMission() {
    try {
      await completeMission(mission.id, { location, photo, completedAt: Date.now() });
      await refreshLocalData(); setIsZen(false); setNotice('Mission logged on this device. Nice noticing.');
      setPhoto(null); setLocation(null); setLocationStatus('not-requested');
    } catch { setNotice('This mission could not be saved. Check browser storage settings.'); }
  }
  async function enterZenMode() {
    setIsStarting(true);
    try { await saveReadyMission(mission); setIsZen(true); }
    catch { setNotice('This mission is ready, but browser storage is unavailable.'); }
    finally { setIsStarting(false); }
  }

  return <main className="app-shell">
    <div className="grain" aria-hidden="true" />
    <header className="topbar"><a className="wordmark" href="#top" aria-label="Touch Grass home"><span className="brand-mark"><Leaf size={17} /></span><span>TOUCH<span className="wordmark-light">GRASS</span></span></a>
      <div className="topbar-right"><span className={`connection ${isOnline ? '' : 'is-offline'}`}><span className="connection-dot" />{isOnline ? 'LOCAL FIELD GUIDE' : 'OFFLINE READY'}</span><div className="streak-pill" aria-label={`${stats.streak} day streak`}><Flame size={15} /><span>{stats.streak}</span><span className="streak-label">DAY STREAK</span></div></div>
    </header>
    <div id="top" className="page-grid"><section className="intro-column">
      <div className="edition-line"><span>FIELD NOTES / NO. 001</span><span className="edition-rule" /><span>AN OPEN-AIR EXPERIMENT</span></div>
      <h1>Out here,<br /><em>look closer.</em></h1><p className="intro-copy">A small mission for a bigger world.<br />Pick one. Put your phone away. See what finds you.</p>
      <div className="landscape-art" aria-label="Illustration of a sun over a grassy horizon"><div className="art-sun" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="ridge ridge-back" /><div className="ridge ridge-front" /><span className="art-caption">THE WORLD IS ALREADY LOADING</span><span className="art-coordinate">NO SIGNAL<br />NO SHORTCUT</span></div>
      <div className="outdoor-note"><Sun size={16} /><span>Made for outside. Works without a signal.</span><ArrowDownRight size={16} /></div>
    </section><section className="mission-column" aria-label="Outdoor mission generator">
      <div className="section-kicker"><span className="kicker-number">01</span><span>YOUR NEXT OUTSIDE MINUTE</span><span className="kicker-line" /></div>
      <div className="mission-panel"><div className="panel-topline"><span className="status-label"><span className="status-dot" /> FIELD TASK</span><span className="local-label"><Sparkles size={13} /> {source === 'offline' ? 'ON-DEVICE' : source.toUpperCase()}</span></div>
        <div className="mission-body"><div className="mission-meta"><span>{mission.categoryLabel || 'Noticing'}</span><span className="meta-divider">/</span><span>{mission.minutes || 10} MIN</span></div><h2>{mission.title}</h2><p className="mission-prompt">{mission.prompt}</p><div className="mission-mark"><Compass size={18} /><span>MISSION {String(stats.completedCount + 1).padStart(3, '0')}</span></div></div>
        <div className="mission-actions"><button className="button button-primary" onClick={enterZenMode} disabled={isStarting}><Footprints size={17} /> {isStarting ? 'PREPARING MISSION...' : 'TAKE IT OUTSIDE'} <ArrowDownRight size={15} /></button><button className="icon-button" onClick={createNewMission} disabled={isGenerating} aria-label="Generate another mission" title="Generate another mission"><RefreshCw size={17} className={isGenerating ? 'spinning' : ''} /></button></div>
      </div>
      <div className="mission-options"><label className="select-field"><span>LOOK FOR</span><span className="select-wrap"><select value={category} onChange={(event) => setCategory(event.target.value)}>{missionCategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} /></span></label>
        <div className="difficulty-field"><span>MAKE IT</span><div className="segmented-control" role="group" aria-label="Mission duration">{durations.map((option) => <button key={option.value} className={difficulty === option.value ? 'selected' : ''} onClick={() => setDifficulty(option.value)}>{option.label}</button>)}</div></div></div>
      <button className="text-action" onClick={createNewMission} disabled={isGenerating}><Sparkles size={14} /> {isGenerating ? 'FINDING A MISSION...' : 'GIVE ME A DIFFERENT MISSION'}</button>
      <div className="field-log"><div className="log-heading"><span>FIELD LOG</span><span>{stats.completedCount} COMPLETE</span></div><div className="log-stats">
        <div className="stat-item"><span className="stat-icon"><Check size={15} /></span><span className="stat-value">{stats.completedCount}</span><span className="stat-caption">MISSIONS DONE</span></div>
        <div className="stat-item"><span className="stat-icon"><Flame size={15} /></span><span className="stat-value">{stats.streak}</span><span className="stat-caption">DAY STREAK</span></div>
        <div className="stat-item"><span className="stat-icon"><MapPin size={15} /></span><span className="stat-value">{stats.placesNoted}</span><span className="stat-caption">PLACES NOTED</span></div>
      </div>{recentMissions.length > 0 && <div className="recent-list"><span className="recent-label">RECENT OBSERVATIONS</span>{recentMissions.slice(0, 2).map((entry) => <div className="recent-row" key={entry.id}><span>{entry.title}</span><span>{new Date(entry.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>)}</div>}</div>
    </section></div>
    <footer className="footer"><span>NO FEED. NO SCOREBOARD. JUST OUTSIDE.</span><span>YOUR DATA STAYS ON THIS DEVICE <span className="footer-dot">●</span></span></footer>
    {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}
    {isZen && <section className="zen-screen" role="dialog" aria-modal="true" aria-labelledby="zen-title"><div className="zen-top"><button className="zen-back" onClick={() => setIsZen(false)}><ArrowLeft size={17} /> BACK TO FIELD NOTES</button><span><span className="status-dot" /> PHONE-DOWN MODE</span></div>
      <div className="zen-center"><div className="zen-sun"><Sun size={34} strokeWidth={1.2} /></div><span className="zen-overline">YOUR ONLY TASK</span><h2 id="zen-title">{mission.title}</h2><p>{mission.prompt}</p><div className="zen-duration"><span /> {mission.minutes || 10} MINUTES · {mission.categoryLabel || 'NOTICING'}</div><div className="zen-quiet">The best part happens when you stop looking at this.</div></div>
      <div className="zen-controls"><div className="capture-tools"><button className={`capture-button ${location ? 'capture-active' : ''}`} onClick={requestLocation} disabled={locationStatus === 'loading'}><LocateFixed size={17} /> {location ? 'PLACE NOTED' : locationStatus === 'loading' ? 'LOCATING…' : 'NOTE PLACE'}</button><button className={`capture-button ${photo ? 'capture-active' : ''}`} onClick={openCamera}><Camera size={17} /> {photo ? 'PHOTO READY' : 'TAKE A PHOTO'}</button></div>
        {photoUrl && <img className="photo-preview" src={photoUrl} alt="Captured field note" />}<button className="button button-finish" onClick={finishMission}><Check size={18} /> I NOTICED SOMETHING <ArrowDownRight size={15} /></button><span className="zen-footnote">Optional notes stay on this device. No signal needed.</span></div></section>}
    {cameraOpen && <div className="camera-overlay" role="dialog" aria-modal="true" aria-label="Camera capture"><div className="camera-frame"><video ref={videoRef} autoPlay playsInline muted /><div className="camera-guide" /><div className="camera-toolbar"><button className="camera-close" onClick={closeCamera} aria-label="Close camera"><X size={20} /></button><span>FIELD NOTE · STORED LOCALLY</span><button className="shutter" onClick={capturePhoto} aria-label="Capture photo"><span /></button></div></div></div>}
  </main>;
}
export default App;