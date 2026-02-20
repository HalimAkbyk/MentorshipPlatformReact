'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroupClass } from '@/lib/hooks/use-classes';
import { videoApi } from '@/lib/api/video';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Video, VideoOff, Mic, MicOff, Hand,
  MessageSquare, Users, PhoneOff, Settings, X, Image as ImageIcon,
  Clock, RefreshCw,
} from 'lucide-react';

import { GroupClassroomLayout } from '@/components/classroom/GroupClassroomLayout';
import { ParticipantsPanel } from '@/components/classroom/ParticipantsPanel';
import {
  RemoteTile, ChatMessage, BgMode,
  VIRTUAL_BACKGROUNDS, parseIdentity,
} from '@/components/classroom/types';

// ─── Virtual Background Processor ───────────────────────────
class VirtualBackgroundProcessor {
  private videoEl: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;
  private fgCanvas: HTMLCanvasElement;
  private fgCtx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private started = false;
  private bgMode: BgMode = { type: 'none' };
  private bgImage: HTMLImageElement | null = null;
  private selfieSegmentation: any | null = null;
  private segmentationReady = false;
  private latestMaskReady = false;

  constructor() {
    this.videoEl = document.createElement('video');
    this.videoEl.autoplay = true; this.videoEl.muted = true; this.videoEl.playsInline = true;
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d'); if (!ctx) throw new Error('no ctx'); this.ctx = ctx;
    this.maskCanvas = document.createElement('canvas');
    const mctx = this.maskCanvas.getContext('2d'); if (!mctx) throw new Error('no mctx'); this.maskCtx = mctx;
    this.fgCanvas = document.createElement('canvas');
    const fctx = this.fgCanvas.getContext('2d'); if (!fctx) throw new Error('no fctx'); this.fgCtx = fctx;
  }

  public async initSegmentationIfNeeded() {
    if (this.segmentationReady) return;
    const mp = await import('@mediapipe/selfie_segmentation');
    const SelfieSegmentation = (mp as any).SelfieSegmentation;
    if (!SelfieSegmentation) throw new Error('SelfieSegmentation not found');
    this.selfieSegmentation = new SelfieSegmentation({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });
    this.selfieSegmentation.setOptions({ modelSelection: 1 });
    this.selfieSegmentation.onResults((results: any) => {
      if (!results?.segmentationMask) return;
      const w = this.canvas.width, h = this.canvas.height;
      this.maskCanvas.width = w; this.maskCanvas.height = h;
      this.maskCtx.clearRect(0, 0, w, h);
      this.maskCtx.drawImage(results.segmentationMask, 0, 0, w, h);
      this.latestMaskReady = true;
    });
    this.segmentationReady = true;
  }

  public async setBackground(mode: BgMode) {
    this.bgMode = mode;
    if (mode.type === 'image') {
      const img = new Image(); img.crossOrigin = 'anonymous'; img.src = mode.url;
      await img.decode(); this.bgImage = img;
    } else { this.bgImage = null; }
  }

  public start(sourceTrack: MediaStreamTrack, fps = 30): MediaStreamTrack {
    this.stop();
    const sourceStream = new MediaStream([sourceTrack]);
    this.videoEl.srcObject = sourceStream;
    const ensureSizes = async () => {
      while (!this.videoEl.videoWidth || !this.videoEl.videoHeight) await new Promise(r => setTimeout(r, 16));
      const w = this.videoEl.videoWidth, h = this.videoEl.videoHeight;
      this.canvas.width = w; this.canvas.height = h;
      this.maskCanvas.width = w; this.maskCanvas.height = h;
      this.fgCanvas.width = w; this.fgCanvas.height = h;
    };
    const render = async () => {
      if (!this.started) return;
      const w = this.canvas.width, h = this.canvas.height;
      if ((this.bgMode.type === 'blur' || this.bgMode.type === 'image') && this.selfieSegmentation) {
        try { await this.selfieSegmentation.send({ image: this.videoEl }); } catch {}
      }
      if (this.bgMode.type === 'blur') { this.ctx.save(); this.ctx.filter = 'blur(12px)'; this.ctx.drawImage(this.videoEl, 0, 0, w, h); this.ctx.restore(); }
      else if (this.bgMode.type === 'image' && this.bgImage) { this.ctx.drawImage(this.bgImage, 0, 0, w, h); }
      else { this.ctx.drawImage(this.videoEl, 0, 0, w, h); this.rafId = requestAnimationFrame(() => { void render(); }); return; }
      if (!this.latestMaskReady) { this.ctx.drawImage(this.videoEl, 0, 0, w, h); }
      else {
        this.fgCtx.clearRect(0, 0, w, h); this.fgCtx.drawImage(this.videoEl, 0, 0, w, h);
        this.fgCtx.globalCompositeOperation = 'destination-in'; this.fgCtx.drawImage(this.maskCanvas, 0, 0, w, h);
        this.fgCtx.globalCompositeOperation = 'source-over'; this.ctx.drawImage(this.fgCanvas, 0, 0, w, h);
      }
      this.rafId = requestAnimationFrame(() => { void render(); });
    };
    this.started = true;
    (async () => { await this.videoEl.play(); await ensureSizes(); void render(); })();
    const outStream = this.canvas.captureStream(fps);
    return outStream.getVideoTracks()[0];
  }

  public stop() {
    this.started = false; if (this.rafId) cancelAnimationFrame(this.rafId); this.rafId = null;
    try { this.videoEl.pause(); } catch {} this.videoEl.srcObject = null; this.latestMaskReady = false;
  }
}

// ─── Page Component ─────────────────────────────────────────
export default function StudentGroupClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const { data: groupClass } = useGroupClass(classId);

  // State
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [duration, setDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(true);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedBackground, setSelectedBackground] = useState('none');

  const [remoteTiles, setRemoteTiles] = useState<RemoteTile[]>([]);

  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const joinAttemptRef = useRef(0);
  const roomRef = useRef<any>(null);
  const rawVideoTrackRef = useRef<any>(null);
  const rawAudioTrackRef = useRef<any>(null);
  const dataTrackRef = useRef<any>(null);
  const processedVideoTrackRef = useRef<any>(null);
  const vbRef = useRef<VirtualBackgroundProcessor | null>(null);
  const vbModeRef = useRef<BgMode>({ type: 'none' });
  const isChatOpenRef = useRef(isChatOpen);
  const localIdentityRef = useRef('');

  const roomName = `group-class-${classId}`;

  // Keep ref in sync
  useEffect(() => { isChatOpenRef.current = isChatOpen; }, [isChatOpen]);
  useEffect(() => { if (isChatOpen) setUnreadCount(0); }, [isChatOpen]);

  // Duration timer
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setDuration(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Enumerate devices
  useEffect(() => { requestPermissionsAndEnumerate(); }, []);

  const requestPermissionsAndEnumerate = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(t => t.stop());
      await enumerateDevices();
    } catch { toast.error('Kamera ve mikrofon izni gerekli'); }
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audio = devices.filter(d => d.kind === 'audioinput');
      const video = devices.filter(d => d.kind === 'videoinput');
      setAudioDevices(audio); setVideoDevices(video);
      if (audio.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(audio[0].deviceId);
      if (video.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(video[0].deviceId);
    } catch {}
  };

  const getVideoConstraints = () => {
    const base: any = {};
    if (selectedVideoDevice) base.deviceId = { exact: selectedVideoDevice };
    if (videoQuality === 'low') return { ...base, width: 640, height: 360 };
    if (videoQuality === 'high') return { ...base, width: 1920, height: 1080 };
    return { ...base, width: 1280, height: 720 };
  };

  const getAudioConstraints = () => {
    if (!selectedAudioDevice) return true;
    return { deviceId: { exact: selectedAudioDevice } };
  };

  // ─── Local preview helpers ───
  const clearLocalContainerVideos = () => {
    if (!localVideoRef.current) return;
    localVideoRef.current.querySelectorAll('video').forEach(v => v.remove());
  };

  const attachLocalPreview = useCallback((videoTrack: any) => {
    if (!localVideoRef.current || !videoTrack) return;
    clearLocalContainerVideos();
    const el = videoTrack.attach() as HTMLVideoElement;
    el.style.width = '100%'; el.style.height = '100%'; el.style.objectFit = 'cover';
    el.muted = true; el.playsInline = true; el.autoplay = true;
    localVideoRef.current.appendChild(el);
  }, []);

  // ─── Remote tile management ───
  const ensureRemoteTile = (identity: string) => {
    const { displayName } = parseIdentity(identity);
    setRemoteTiles(prev => {
      if (prev.some(t => t.identity === identity)) return prev;
      return [...prev, {
        identity, displayName, isHandRaised: false,
        isAudioEnabled: true, isVideoEnabled: true,
        cameraVideoEl: null, screenVideoEl: null, audioEls: [],
      }];
    });
  };

  const removeRemoteTile = (identity: string) => {
    setRemoteTiles(prev => {
      const tile = prev.find(t => t.identity === identity);
      tile?.audioEls?.forEach(el => { try { el.remove(); } catch {} });
      return prev.filter(t => t.identity !== identity);
    });
  };

  const setRemoteHand = (identity: string, raised: boolean) => {
    setRemoteTiles(prev => prev.map(t => t.identity === identity ? { ...t, isHandRaised: raised } : t));
  };

  const setRemoteCameraVideoEl = (identity: string, el: HTMLVideoElement | null) => {
    setRemoteTiles(prev => prev.map(t => t.identity === identity ? { ...t, cameraVideoEl: el } : t));
  };

  const addRemoteAudioEl = (identity: string, el: HTMLMediaElement) => {
    setRemoteTiles(prev => prev.map(t => {
      if (t.identity !== identity) return t;
      return { ...t, audioEls: [...(t.audioEls ?? []), el] };
    }));
  };

  const setRemoteAudioEnabled = (identity: string, enabled: boolean) => {
    setRemoteTiles(prev => prev.map(t => t.identity === identity ? { ...t, isAudioEnabled: enabled } : t));
  };

  // ─── Pipeline helpers ───
  const stopProcessedPipeline = () => {
    try { vbRef.current?.stop(); } catch {}
    if (processedVideoTrackRef.current) { try { processedVideoTrackRef.current.stop?.(); } catch {} processedVideoTrackRef.current = null; }
    vbModeRef.current = { type: 'none' };
  };

  const fullDisconnect = useCallback(() => {
    try { roomRef.current?.disconnect(); } catch {}
    roomRef.current = null; setIsConnected(false);
    try { rawVideoTrackRef.current?.stop?.(); } catch {}
    try { rawAudioTrackRef.current?.stop?.(); } catch {}
    rawVideoTrackRef.current = null; rawAudioTrackRef.current = null; dataTrackRef.current = null;
    stopProcessedPipeline();
    clearLocalContainerVideos();
    setRemoteTiles(prev => { prev.forEach(t => t.audioEls?.forEach(el => { try { el.remove(); } catch {} })); return []; });
  }, []);

  useEffect(() => { return () => { fullDisconnect(); }; }, [fullDisconnect]);

  // ─── Data track ───
  const sendDataTrackMessage = (msg: any) => {
    const r = roomRef.current; if (!r) return;
    try {
      const pubs = Array.from(r.localParticipant.dataTracks.values()) as any[];
      const pub = pubs[0];
      if (pub?.track) pub.track.send(JSON.stringify(msg));
    } catch (e) { console.error('DataTrack send error:', e); }
  };

  const handleDataMessage = (data: string, participant: any) => {
    try {
      const msg = JSON.parse(data);
      const { displayName } = parseIdentity(participant.identity);

      if (msg.type === 'CHAT_MESSAGE') {
        setMessages(prev => [...prev, { text: msg.text, sender: displayName, time: new Date(msg.timestamp).toLocaleTimeString() }]);
        if (!isChatOpenRef.current) setUnreadCount(prev => prev + 1);
      } else if (msg.type === 'HAND_RAISE') {
        setRemoteHand(participant.identity, !!msg.raised);
      } else if (msg.type === 'MUTE_PARTICIPANT') {
        // Check if this mute command targets us
        if (msg.targetIdentity === localIdentityRef.current) {
          const r = roomRef.current; if (r) {
            r.localParticipant.audioTracks.forEach((pub: any) => { pub.track.disable(); });
            setIsAudioEnabled(false);
            toast.warning('Mentor mikrofonunuzu kapattı');
          }
        }
      } else if (msg.type === 'KICK_PARTICIPANT') {
        if (msg.targetIdentity === localIdentityRef.current) {
          toast.error('Mentor tarafından odadan çıkarıldınız');
          fullDisconnect();
          router.push('/student/my-classes');
        }
      }
    } catch (error) { console.error('Data message parse error:', error); }
  };

  // ─── Remote track attach/detach ───
  const attachRemoteTrack = (track: any, participant: any) => {
    const identity = participant.identity as string;
    ensureRemoteTile(identity);
    if (track.kind === 'video') {
      const video = track.attach() as HTMLVideoElement;
      video.playsInline = true; video.autoplay = true;
      video.style.width = '100%'; video.style.height = '100%'; video.style.objectFit = 'cover';
      setRemoteCameraVideoEl(identity, video);
    } else if (track.kind === 'audio') {
      const audioEl = track.attach() as HTMLMediaElement;
      audioEl.style.display = 'none'; document.body.appendChild(audioEl);
      addRemoteAudioEl(identity, audioEl);
    } else if (track.kind === 'data') {
      track.on('message', (payload: string) => handleDataMessage(payload, participant));
    }
  };

  const detachRemoteTrack = (track: any, participant: any) => {
    const identity = participant.identity as string;
    try { const els = track.detach?.() ?? []; els.forEach((el: any) => { try { el.remove(); } catch {} }); } catch {}
    if (track.kind === 'video') setRemoteCameraVideoEl(identity, null);
  };

  // ─── Connect to Room ───
  const connectToRoom = useCallback(async () => {
    const attemptId = ++joinAttemptRef.current;
    if (isConnecting) return;
    try {
      setIsConnecting(true); setWaitingForHost(false);

      const tokenResult = await videoApi.getToken({ roomName, isHost: false });

      const TwilioVideo = (await import('twilio-video')).default;
      const { createLocalTracks, LocalDataTrack } = await import('twilio-video');
      const localTracks = await createLocalTracks({ audio: getAudioConstraints(), video: getVideoConstraints() });
      const audioTrack = localTracks.find((t: any) => t.kind === 'audio');
      const videoTrack = localTracks.find((t: any) => t.kind === 'video');
      const dataTrack = new LocalDataTrack();

      if (joinAttemptRef.current !== attemptId) {
        localTracks.forEach((t: any) => { try { (t as any).stop?.(); } catch {} });
        return;
      }

      const newRoom = await TwilioVideo.connect(tokenResult.token, {
        name: roomName, tracks: [...localTracks, dataTrack],
      });

      if (joinAttemptRef.current !== attemptId) {
        try { newRoom.disconnect(); } catch {}
        localTracks.forEach((t: any) => { try { (t as any).stop?.(); } catch {} });
        return;
      }

      roomRef.current = newRoom; setIsConnected(true);
      rawAudioTrackRef.current = audioTrack; rawVideoTrackRef.current = videoTrack; dataTrackRef.current = dataTrack;
      localIdentityRef.current = newRoom.localParticipant.identity;
      attachLocalPreview(videoTrack);

      const handleParticipant = (p: any) => {
        ensureRemoteTile(p.identity);
        p.tracks.forEach((pub: any) => { if (pub.isSubscribed && pub.track) attachRemoteTrack(pub.track, p); });
        p.on('trackSubscribed', (track: any) => attachRemoteTrack(track, p));
        p.on('trackUnsubscribed', (track: any) => detachRemoteTrack(track, p));
        p.on('trackDisabled', (track: any) => { if (track.kind === 'audio') setRemoteAudioEnabled(p.identity, false); });
        p.on('trackEnabled', (track: any) => { if (track.kind === 'audio') setRemoteAudioEnabled(p.identity, true); });
      };

      newRoom.participants.forEach(handleParticipant);
      newRoom.on('participantConnected', (p: any) => {
        const { displayName } = parseIdentity(p.identity);
        toast.success(`${displayName} derse katıldı`);
        handleParticipant(p);
      });
      newRoom.on('participantDisconnected', (p: any) => {
        const { displayName } = parseIdentity(p.identity);
        toast.info(`${displayName} dersten ayrıldı`);
        removeRemoteTile(p.identity);
      });
      newRoom.on('disconnected', (_room: any, error: any) => {
        fullDisconnect();
        if (error) {
          // Room was completed by mentor → kicked or room closed
          toast.info('Ders sonlandırıldı');
          router.push('/student/my-classes');
        } else {
          // Mentor may have temporarily left → go back to waiting state
          toast.info('Bağlantı kesildi. Mentor tekrar bağlanırsa otomatik katılacaksınız.');
          setWaitingForHost(true);
        }
      });

      toast.success('Derse katıldınız!');
    } catch (e: any) {
      console.error('Room join error:', e);
      toast.error('Bağlantı hatası: ' + (e?.message ?? ''));
      setWaitingForHost(true);
    } finally { setIsConnecting(false); }
  }, [classId, roomName, isConnecting, attachLocalPreview, fullDisconnect]);

  // ─── Check Room Status ───
  const checkRoomStatus = useCallback(async () => {
    try {
      setCheckingRoom(true);
      const status = await videoApi.getRoomStatus(roomName);
      if (status.isActive && status.hostConnected) connectToRoom();
      else setWaitingForHost(true);
    } catch { setWaitingForHost(true); }
    finally { setCheckingRoom(false); }
  }, [roomName, connectToRoom]);

  useEffect(() => { checkRoomStatus(); return () => { fullDisconnect(); }; }, [classId]);

  useEffect(() => {
    if (!waitingForHost || isConnected || isConnecting) return;
    const interval = setInterval(() => checkRoomStatus(), 5000);
    return () => clearInterval(interval);
  }, [waitingForHost, isConnected, isConnecting, checkRoomStatus]);

  // ─── Toggle Functions ───
  const toggleVideo = () => {
    const r = roomRef.current; if (!r) return;
    r.localParticipant.videoTracks.forEach((pub: any) => { isVideoEnabled ? pub.track.disable() : pub.track.enable(); });
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    const r = roomRef.current; if (!r) return;
    r.localParticipant.audioTracks.forEach((pub: any) => { isAudioEnabled ? pub.track.disable() : pub.track.enable(); });
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleHandRaise = () => {
    const newVal = !isHandRaised;
    setIsHandRaised(newVal);
    sendDataTrackMessage({ type: 'HAND_RAISE', raised: newVal, timestamp: Date.now() });
    toast.info(newVal ? 'Elinizi kaldırdınız ✋' : 'Elinizi indirdiniz');
  };

  // ─── Device / Background changes ───
  const changeAudioDevice = async (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    const r = roomRef.current; if (!r) return;
    try {
      const pubs = Array.from(r.localParticipant.audioTracks.values()) as any[];
      if (pubs[0]?.track) { await pubs[0].track.restart({ deviceId: { exact: deviceId } }); rawAudioTrackRef.current = pubs[0].track; toast.success('Mikrofon değiştirildi'); }
    } catch { toast.error('Mikrofon değiştirilemedi'); }
  };

  const changeVideoDevice = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    const r = roomRef.current; if (!r) return;
    try {
      const raw = rawVideoTrackRef.current; if (!raw) return;
      await raw.restart({ ...getVideoConstraints(), deviceId: { exact: deviceId } });
      if (vbModeRef.current.type === 'none') attachLocalPreview(raw); else await reapplyBackgroundIfNeeded();
      toast.success('Kamera değiştirildi');
    } catch { toast.error('Kamera değiştirilemedi'); }
  };

  const changeVideoQuality = async (quality: 'low' | 'medium' | 'high') => {
    setVideoQuality(quality);
    const r = roomRef.current; if (!r) return;
    try {
      const raw = rawVideoTrackRef.current; if (!raw) return;
      await raw.restart(getVideoConstraints());
      if (vbModeRef.current.type === 'none') attachLocalPreview(raw); else await reapplyBackgroundIfNeeded();
    } catch {}
  };

  const reapplyBackgroundIfNeeded = async () => {
    const mode = vbModeRef.current; if (mode.type === 'none') return;
    await applyBackground(mode, { silent: true });
  };

  const applyBackground = async (mode: BgMode, opts?: { silent?: boolean }) => {
    const r = roomRef.current; const raw = rawVideoTrackRef.current; if (!r || !raw) return;
    vbModeRef.current = mode;
    if (mode.type === 'none') {
      if (processedVideoTrackRef.current) try { r.localParticipant.unpublishTrack(processedVideoTrackRef.current); } catch {}
      try { vbRef.current?.stop(); } catch {}
      if (processedVideoTrackRef.current) { try { processedVideoTrackRef.current.stop?.(); } catch {} processedVideoTrackRef.current = null; }
      try { r.localParticipant.publishTrack(raw); } catch {}
      attachLocalPreview(raw);
      if (!opts?.silent) toast.success('Arka plan kaldırıldı');
      return;
    }
    if (!vbRef.current) vbRef.current = new VirtualBackgroundProcessor();
    try { await vbRef.current.initSegmentationIfNeeded(); } catch { vbModeRef.current = { type: 'none' }; toast.error('Sanal arka plan başlatılamadı'); return; }
    await vbRef.current.setBackground(mode);
    const processedMediaTrack = vbRef.current.start(raw.mediaStreamTrack, 30);
    const { LocalVideoTrack } = await import('twilio-video');
    const processedTwilioTrack = new LocalVideoTrack(processedMediaTrack);
    if (processedVideoTrackRef.current) { try { r.localParticipant.unpublishTrack(processedVideoTrackRef.current); } catch {} try { processedVideoTrackRef.current.stop?.(); } catch {} }
    try { r.localParticipant.unpublishTrack(raw); } catch {}
    r.localParticipant.publishTrack(processedTwilioTrack);
    processedVideoTrackRef.current = processedTwilioTrack;
    attachLocalPreview(processedTwilioTrack);
    if (!opts?.silent) { if (mode.type === 'blur') toast.success('Bulanık arka plan aktif'); if (mode.type === 'image') toast.success('Arka plan aktif'); }
  };

  const changeBackground = async (backgroundId: string) => {
    setSelectedBackground(backgroundId);
    const bg = VIRTUAL_BACKGROUNDS.find(b => b.id === backgroundId); if (!bg) return;
    try {
      if (backgroundId === 'none') await applyBackground({ type: 'none' });
      else if (backgroundId === 'blur') await applyBackground({ type: 'blur' });
      else if (bg.image) await applyBackground({ type: 'image', url: bg.image });
    } catch { toast.error('Arka plan değiştirilemedi'); }
  };

  // ─── Chat ───
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    sendDataTrackMessage({ type: 'CHAT_MESSAGE', text: newMessage, timestamp: Date.now() });
    setMessages(prev => [...prev, { text: newMessage, sender: 'Sen', time: new Date().toLocaleTimeString() }]);
    setNewMessage('');
  };

  // ─── Leave ───
  const handleLeave = () => { fullDisconnect(); router.push('/student/my-classes'); };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── Waiting Screen ───
  if (waitingForHost && !isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Mentor Bekleniyor</h2>
          <p className="text-gray-400 mb-2">{groupClass?.title || 'Grup Dersi'}</p>
          <p className="text-sm text-gray-500 mb-6">Mentor ders odasını henüz açmadı. Oda açıldığında otomatik olarak bağlanacaksınız.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <RefreshCw className={`w-4 h-4 ${checkingRoom ? 'animate-spin' : ''}`} />
            <span>Kontrol ediliyor...</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/student/my-classes')}>Geri Dön</Button>
        </div>
      </div>
    );
  }

  if (isConnecting && !isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Derse bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold">{groupClass?.title || 'Grup Dersi'}</h1>
          <Badge variant="destructive" className="animate-pulse">CANLI</Badge>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users className="w-4 h-4" />
            <span>{1 + remoteTiles.length} katılımcı</span>
          </div>
          <div className="text-white font-mono text-lg">{formatDuration(duration)}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 p-4 min-h-0">
          <GroupClassroomLayout
            localVideoRef={localVideoRef}
            isVideoEnabled={isVideoEnabled}
            isRoomActive={true}
            isMentor={false}
            localLabel="Sen"
            remoteTiles={remoteTiles}
          />
        </div>

        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-700 flex justify-between">
              <h3 className="text-white font-semibold">Sohbet</h3>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-white font-medium text-sm">{msg.sender}</span>
                    <span className="text-gray-400 text-xs">{msg.time}</span>
                  </div>
                  <p className="text-gray-200 text-sm">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Mesaj yazın..." className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <Button onClick={sendMessage} size="sm">Gönder</Button>
              </div>
            </div>
          </div>
        )}

        {isParticipantsOpen && (
          <ParticipantsPanel remoteTiles={remoteTiles} localDisplayName="Öğrenci" localIsAudioEnabled={isAudioEnabled} localIsVideoEnabled={isVideoEnabled}
            isMentor={false} onClose={() => setIsParticipantsOpen(false)} />
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3 shrink-0">
        <div className="flex items-center justify-center gap-3">
          <Button variant={isAudioEnabled ? 'secondary' : 'destructive'} size="lg" onClick={toggleAudio} className="rounded-full w-14 h-14 px-0">
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          <Button variant={isVideoEnabled ? 'secondary' : 'destructive'} size="lg" onClick={toggleVideo} className="rounded-full w-14 h-14 px-0">
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          <Button variant={isHandRaised ? 'default' : 'secondary'} size="lg" onClick={toggleHandRaise} className={`rounded-full w-14 h-14 px-0 ${isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}>
            <Hand className="w-5 h-5" />
          </Button>
          <Button variant={isChatOpen ? 'default' : 'secondary'} size="lg" onClick={() => { setIsChatOpen(!isChatOpen); if (!isChatOpen) setIsParticipantsOpen(false); }} className="rounded-full w-14 h-14 px-0 relative">
            <MessageSquare className="w-5 h-5" />
            {!isChatOpen && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
          <Button variant={isParticipantsOpen ? 'default' : 'secondary'} size="lg" onClick={() => { setIsParticipantsOpen(!isParticipantsOpen); if (!isParticipantsOpen) setIsChatOpen(false); }} className="rounded-full w-14 h-14 px-0">
            <Users className="w-5 h-5" />
          </Button>
          <Button variant={isSettingsOpen ? 'default' : 'secondary'} size="lg" onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="rounded-full w-14 h-14 px-0">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="destructive" size="lg" onClick={handleLeave} className="rounded-full px-6">
            <PhoneOff className="w-5 h-5 mr-2" /> Ayrıl
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
              <h2 className="text-xl font-semibold text-white">Ayarlar</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mikrofon</label>
                <select value={selectedAudioDevice} onChange={e => changeAudioDevice(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-3 py-2">
                  {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mikrofon ${d.deviceId.slice(0, 8)}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Kamera</label>
                <select value={selectedVideoDevice} onChange={e => changeVideoDevice(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-3 py-2">
                  {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${d.deviceId.slice(0, 8)}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Video Kalitesi</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map(q => (
                    <button key={q} onClick={() => changeVideoQuality(q)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${videoQuality === q ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                      {q === 'low' && '360p'}{q === 'medium' && '720p'}{q === 'high' && '1080p'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2"><ImageIcon className="w-4 h-4 inline mr-2" />Sanal Arka Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {VIRTUAL_BACKGROUNDS.map(bg => (
                    <button key={bg.id} onClick={() => changeBackground(bg.id)}
                      className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedBackground === bg.id ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-600 hover:border-gray-500'}`}>
                      {bg.image === 'blur' ? <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center"><span className="text-white text-xs">Blur</span></div>
                        : bg.image ? <img src={bg.image} alt={bg.name} className="w-full h-full object-cover" />
                        : <div className="absolute inset-0 bg-gray-700 flex items-center justify-center"><X className="w-6 h-6 text-gray-400" /></div>}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 px-2 py-1"><span className="text-white text-xs">{bg.name}</span></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
