"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

type FaceLandmarkerInstance = import("@mediapipe/tasks-vision").FaceLandmarker;

type LivenessPayload = {
  blinkPassed: boolean;
  leftTurnPassed: boolean;
  rightTurnPassed: boolean;
  turnPassed: boolean;
  yaw: number;
  eyeAspectRatio: number;
  blinkScore: number;
};

type CompletionPayload = {
  descriptor: number[];
  livenessData: LivenessPayload;
};

type DetectionInstruction = "face" | "blink" | "left" | "right" | "done";

type DetectionVisualState = {
  faceDetected: boolean;
  blinkPassed: boolean;
  leftTurnPassed: boolean;
  rightTurnPassed: boolean;
  instruction: DetectionInstruction;
};

type ProgressState = {
  blinkClosureSeen: boolean;
  blinkClosedFrames: number;
  blinkOpenFrames: number;
  leftFrames: number;
  rightFrames: number;
  blinkPassed: boolean;
  leftTurnPassed: boolean;
  rightTurnPassed: boolean;
  emitted: boolean;
};

const LEFT_EYE_EAR_INDICES = [33, 160, 158, 133, 153, 144] as const;
const RIGHT_EYE_EAR_INDICES = [362, 385, 387, 263, 373, 380] as const;
const DESCRIPTOR_INDICES = [10, 33, 61, 133, 152, 263, 291, 1, 4, 13, 234, 454] as const;
const NOSE_INDEX = 1;
const LEFT_CHEEK_INDEX = 234;
const RIGHT_CHEEK_INDEX = 454;
const LEFT_EYE_OUTER_INDEX = 33;
const LEFT_EYE_INNER_INDEX = 133;
const RIGHT_EYE_INNER_INDEX = 362;
const RIGHT_EYE_OUTER_INDEX = 263;
const FACE_TOP_INDEX = 10;
const FACE_BOTTOM_INDEX = 152;
const YAW_THRESHOLD = 0.085;
const CENTER_THRESHOLD = 0.035;

const defaultVisualState: DetectionVisualState = {
  faceDetected: false,
  blinkPassed: false,
  leftTurnPassed: false,
  rightTurnPassed: false,
  instruction: "face"
};

function roundMetric(value: number, digits = 5) {
  return Number(value.toFixed(digits));
}

function distance2d(first: NormalizedLandmark, second: NormalizedLandmark) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function midpoint(first: NormalizedLandmark, second: NormalizedLandmark) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    z: (first.z + second.z) / 2,
    visibility: Math.min(first.visibility ?? 1, second.visibility ?? 1)
  };
}

function buildProgressState(): ProgressState {
  return {
    blinkClosureSeen: false,
    blinkClosedFrames: 0,
    blinkOpenFrames: 0,
    leftFrames: 0,
    rightFrames: 0,
    blinkPassed: false,
    leftTurnPassed: false,
    rightTurnPassed: false,
    emitted: false
  };
}

function computeEar(landmarks: NormalizedLandmark[], indices: readonly [number, number, number, number, number, number]) {
  const [outerCorner, upperOuter, upperInner, innerCorner, lowerInner, lowerOuter] = indices;
  const horizontal = distance2d(landmarks[outerCorner], landmarks[innerCorner]);

  if (!horizontal) {
    return 0;
  }

  const verticalA = distance2d(landmarks[upperOuter], landmarks[lowerOuter]);
  const verticalB = distance2d(landmarks[upperInner], landmarks[lowerInner]);
  return (verticalA + verticalB) / (2 * horizontal);
}

function buildBlendshapeMap(result: FaceLandmarkerResult) {
  const categories = result.faceBlendshapes[0]?.categories ?? [];
  return new Map(categories.map((category) => [category.categoryName, category.score]));
}

function computeYaw(landmarks: NormalizedLandmark[]) {
  const nose = landmarks[NOSE_INDEX];
  const leftCheek = landmarks[LEFT_CHEEK_INDEX];
  const rightCheek = landmarks[RIGHT_CHEEK_INDEX];
  const leftDistance = distance2d(nose, leftCheek);
  const rightDistance = distance2d(nose, rightCheek);
  const totalDistance = leftDistance + rightDistance;

  if (!totalDistance) {
    return 0;
  }

  return (leftDistance - rightDistance) / totalDistance;
}

function isFaceStable(landmarks: NormalizedLandmark[]) {
  const xs = landmarks.map((landmark) => landmark.x);
  const ys = landmarks.map((landmark) => landmark.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  const eyeCenter = midpoint(landmarks[LEFT_EYE_OUTER_INDEX], landmarks[RIGHT_EYE_OUTER_INDEX]);

  return width > 0.16 && width < 0.72 && height > 0.2 && height < 0.86 && eyeCenter.y > 0.22 && eyeCenter.y < 0.55 && minX > 0.04 && maxX < 0.96 && minY > 0.02 && maxY < 0.98;
}

function buildDescriptor(landmarks: NormalizedLandmark[]) {
  const leftEyeCenter = midpoint(landmarks[LEFT_EYE_OUTER_INDEX], landmarks[LEFT_EYE_INNER_INDEX]);
  const rightEyeCenter = midpoint(landmarks[RIGHT_EYE_INNER_INDEX], landmarks[RIGHT_EYE_OUTER_INDEX]);
  const faceCenter = midpoint(landmarks[NOSE_INDEX], landmarks[FACE_TOP_INDEX]);
  const scale = Math.max(distance2d(leftEyeCenter, rightEyeCenter), 0.001);

  return DESCRIPTOR_INDICES.flatMap((index) => {
    const point = landmarks[index];
    return [
      roundMetric((point.x - faceCenter.x) / scale),
      roundMetric((point.y - faceCenter.y) / scale),
      roundMetric(point.z / scale)
    ];
  });
}

function drawScannerFrame(context: CanvasRenderingContext2D, width: number, height: number, active: boolean) {
  const marginX = width * 0.16;
  const marginY = height * 0.1;
  const frameWidth = width - marginX * 2;
  const frameHeight = height - marginY * 2;
  const radius = Math.min(frameWidth, frameHeight) * 0.08;
  const cornerLength = radius * 1.2;

  context.save();
  context.strokeStyle = active ? "rgba(0, 255, 136, 0.9)" : "rgba(255, 255, 255, 0.2)";
  context.lineWidth = active ? 4 : 3;
  context.shadowBlur = active ? 20 : 0;
  context.shadowColor = active ? "rgba(0, 255, 136, 0.6)" : "transparent";
  context.beginPath();
  context.roundRect(marginX, marginY, frameWidth, frameHeight, radius);
  context.stroke();

  context.lineWidth = 5;
  context.shadowBlur = active ? 24 : 0;

  context.beginPath();
  context.moveTo(marginX, marginY + cornerLength);
  context.lineTo(marginX, marginY);
  context.lineTo(marginX + cornerLength, marginY);
  context.moveTo(marginX + frameWidth - cornerLength, marginY);
  context.lineTo(marginX + frameWidth, marginY);
  context.lineTo(marginX + frameWidth, marginY + cornerLength);
  context.moveTo(marginX, marginY + frameHeight - cornerLength);
  context.lineTo(marginX, marginY + frameHeight);
  context.lineTo(marginX + cornerLength, marginY + frameHeight);
  context.moveTo(marginX + frameWidth - cornerLength, marginY + frameHeight);
  context.lineTo(marginX + frameWidth, marginY + frameHeight);
  context.lineTo(marginX + frameWidth, marginY + frameHeight - cornerLength);
  context.stroke();
  context.restore();
}

function drawLandmarks(context: CanvasRenderingContext2D, width: number, height: number, landmarks: NormalizedLandmark[], active: boolean) {
  context.save();
  context.fillStyle = active ? "rgba(0, 255, 136, 0.95)" : "rgba(0, 204, 255, 0.85)";

  for (let index = 0; index < landmarks.length; index += 6) {
    const point = landmarks[index];
    context.beginPath();
    context.arc(point.x * width, point.y * height, 1.7, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

async function waitForVideo(video: HTMLVideoElement) {
  if (video.readyState >= 2 && video.videoWidth > 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Camera stream timed out."));
    }, 10000);

    const onReady = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Camera preview failed to initialize."));
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
    };

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError);
  });
}

export function CameraCapture({
  onComplete,
  busy = false
}: {
  onComplete: (payload: CompletionPayload) => void;
  busy?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const progressRef = useRef<ProgressState>(buildProgressState());
  const visualStateRef = useRef<DetectionVisualState>(defaultVisualState);
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "error">("loading");
  const [modelState, setModelState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [visualState, setVisualState] = useState<DetectionVisualState>(defaultVisualState);

  const syncVisualState = useCallback((next: DetectionVisualState) => {
    const previous = visualStateRef.current;

    if (
      previous.faceDetected === next.faceDetected &&
      previous.blinkPassed === next.blinkPassed &&
      previous.leftTurnPassed === next.leftTurnPassed &&
      previous.rightTurnPassed === next.rightTurnPassed &&
      previous.instruction === next.instruction
    ) {
      return;
    }

    visualStateRef.current = next;
    setVisualState(next);
  }, []);

  const clearOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const resetProgress = useCallback(() => {
    progressRef.current = buildProgressState();
    syncVisualState(defaultVisualState);
  }, [syncVisualState]);

  const stopLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopLoop();
    clearOverlay();
    lastVideoTimeRef.current = -1;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, [clearOverlay, stopLoop]);

  const initializeLandmarker = useCallback(async () => {
    setModelState("loading");

    try {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/wasm");

      async function createLandmarker(delegate: "GPU" | "CPU") {
        return FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker.task",
            delegate
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.65,
          minFacePresenceConfidence: 0.65,
          minTrackingConfidence: 0.65,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true
        });
      }

      landmarkerRef.current?.close();

      try {
        landmarkerRef.current = await createLandmarker("GPU");
      } catch {
        landmarkerRef.current = await createLandmarker("CPU");
      }

      setModelState("ready");
    } catch (error) {
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setModelState("error");
      setErrorMessage(error instanceof Error ? error.message : "AI runtime unavailable.");
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("error");
      setErrorMessage("Camera not supported.");
      return;
    }

    if (!videoRef.current) {
      setCameraState("error");
      setErrorMessage("Camera not ready.");
      return;
    }

    setCameraState("loading");
    setErrorMessage("");
    resetProgress();

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      const video = videoRef.current;

      if (!video) {
        throw new Error("Video preview not ready.");
      }

      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      await waitForVideo(video);
      await video.play();
      setCameraState("ready");
    } catch (error) {
      stopCamera();
      setCameraState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to access camera.");
    }
  }, [resetProgress, stopCamera]);

  const drawFrame = useCallback((landmarks: NormalizedLandmark[] | null, faceReady: boolean) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !video || !context || !video.videoWidth || !video.videoHeight) {
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawScannerFrame(context, canvas.width, canvas.height, faceReady);

    if (landmarks?.length) {
      drawLandmarks(context, canvas.width, canvas.height, landmarks, faceReady);
    }
  }, []);

  const analyzeFrame = useCallback(
    (result: FaceLandmarkerResult) => {
      const landmarks = result.faceLandmarks[0];
      const progress = progressRef.current;

      if (!landmarks?.length || !isFaceStable(landmarks)) {
        progress.blinkClosedFrames = 0;
        progress.blinkOpenFrames = 0;
        progress.leftFrames = 0;
        progress.rightFrames = 0;
        drawFrame(null, false);
        syncVisualState({
          faceDetected: false,
          blinkPassed: progress.blinkPassed,
          leftTurnPassed: progress.leftTurnPassed,
          rightTurnPassed: progress.rightTurnPassed,
          instruction: "face"
        });
        return;
      }

      const blendshapes = buildBlendshapeMap(result);
      const blinkLeft = blendshapes.get("eyeBlinkLeft") ?? 0;
      const blinkRight = blendshapes.get("eyeBlinkRight") ?? 0;
      const blinkScore = (blinkLeft + blinkRight) / 2;
      const leftEar = computeEar(landmarks, LEFT_EYE_EAR_INDICES);
      const rightEar = computeEar(landmarks, RIGHT_EYE_EAR_INDICES);
      const eyeAspectRatio = (leftEar + rightEar) / 2;
      const yaw = computeYaw(landmarks);
      const centered = Math.abs(yaw) < CENTER_THRESHOLD;
      const eyesClosed = blinkScore > 0.35 || eyeAspectRatio < 0.155;
      const eyesOpen = blinkScore < 0.18 && eyeAspectRatio > 0.175;

      if (!progress.blinkPassed) {
        progress.blinkClosedFrames = eyesClosed ? progress.blinkClosedFrames + 1 : 0;

        if (progress.blinkClosedFrames >= 2) {
          progress.blinkClosureSeen = true;
        }

        if (progress.blinkClosureSeen) {
          progress.blinkOpenFrames = eyesOpen ? progress.blinkOpenFrames + 1 : 0;

          if (progress.blinkOpenFrames >= 2) {
            progress.blinkPassed = true;
          }
        }
      }

      if (progress.blinkPassed) {
        progress.leftFrames = yaw <= -YAW_THRESHOLD ? progress.leftFrames + 1 : centered ? 0 : Math.max(progress.leftFrames - 1, 0);
        progress.rightFrames = yaw >= YAW_THRESHOLD ? progress.rightFrames + 1 : centered ? 0 : Math.max(progress.rightFrames - 1, 0);

        if (progress.leftFrames >= 3) {
          progress.leftTurnPassed = true;
        }

        if (progress.rightFrames >= 3) {
          progress.rightTurnPassed = true;
        }
      }

      const allChecksPassed = progress.blinkPassed && progress.leftTurnPassed && progress.rightTurnPassed;

      drawFrame(landmarks, true);
      syncVisualState({
        faceDetected: true,
        blinkPassed: progress.blinkPassed,
        leftTurnPassed: progress.leftTurnPassed,
        rightTurnPassed: progress.rightTurnPassed,
        instruction: allChecksPassed ? "done" : !progress.blinkPassed ? "blink" : !progress.leftTurnPassed ? "left" : "right"
      });

      if (!allChecksPassed || progress.emitted) {
        return;
      }

      progress.emitted = true;
      onComplete({
        descriptor: buildDescriptor(landmarks),
        livenessData: {
          blinkPassed: true,
          leftTurnPassed: true,
          rightTurnPassed: true,
          turnPassed: true,
          yaw: roundMetric(yaw, 4),
          eyeAspectRatio: roundMetric(eyeAspectRatio, 4),
          blinkScore: roundMetric(blinkScore, 4)
        }
      });
    },
    [drawFrame, onComplete, syncVisualState]
  );

  useEffect(() => {
    void initializeLandmarker();
    void startCamera();

    return () => {
      stopCamera();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [initializeLandmarker, startCamera, stopCamera]);

  useEffect(() => {
    if (cameraState !== "ready" || modelState !== "ready") {
      stopLoop();
      return;
    }

    let cancelled = false;

    const tick = () => {
      if (cancelled) {
        return;
      }

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2 && video.videoWidth > 0 && lastVideoTimeRef.current !== video.currentTime) {
        lastVideoTimeRef.current = video.currentTime;
        analyzeFrame(landmarker.detectForVideo(video, performance.now()));
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      stopLoop();
    };
  }, [analyzeFrame, cameraState, modelState, stopLoop]);

  return (
    <section className={`capture-stage ${busy ? "is-processing" : ""}`}>
      <div className="capture-frame">
        <video
          ref={videoRef}
          className={`camera-video ${cameraState !== "ready" ? "is-muted" : ""}`}
          autoPlay
          muted
          playsInline
        />
        <canvas ref={overlayCanvasRef} className="camera-overlay-canvas" />

        <div className="capture-hud">
          <span className={`capture-chip ${visualState.faceDetected ? "done" : visualState.instruction === "face" ? "active" : ""}`}>Face</span>
          <span className={`capture-chip ${visualState.blinkPassed ? "done" : visualState.instruction === "blink" ? "active" : ""}`}>Blink</span>
          <span className={`capture-chip ${visualState.leftTurnPassed ? "done" : visualState.instruction === "left" ? "active" : ""}`}>Left</span>
          <span className={`capture-chip ${visualState.rightTurnPassed ? "done" : visualState.instruction === "right" ? "active" : ""}`}>Right</span>
        </div>

        {busy ? <div className="camera-busy-indicator">Verifying</div> : null}

        {cameraState !== "ready" || modelState !== "ready" || errorMessage ? (
          <div className="camera-overlay">
            <strong>
              {cameraState === "loading"
                ? "Allow camera"
                : modelState === "loading"
                  ? "Loading AI"
                  : "Camera unavailable"}
            </strong>
            <span>
              {cameraState === "error" || modelState === "error"
                ? errorMessage
                : cameraState === "loading"
                  ? "Permission required"
                  : "Preparing detection"}
            </span>
          </div>
        ) : null}
      </div>

      <div className="capture-controls">
        <button className="secondary-button" type="button" onClick={() => void startCamera()}>
          Restart
        </button>
      </div>
    </section>
  );
}
