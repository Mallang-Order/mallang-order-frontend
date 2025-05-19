import { useEffect, useState, useRef } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useVoiceStore } from '../store/voiceStore';
import LanguageSelector from '@/components/LanguageSelector';
import { useGpt } from '../hooks/useGpt';
import { useLanguageStore } from '@/store/languageStore';

const apiUrl = import.meta.env.VITE_GPT_API_URL;

const Voice = () => {
  const { listening, transcript, resetTranscript } = useSpeechRecognition();
  const { isCovered, setIsCovered } = useVoiceStore();
  const [detectedCount, setDetectedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedText, setCapturedText] = useState('');
  const lastTextTimeRef = useRef<number>(0);
  const keywordIndexRef = useRef<number>(-1);

  const { language } = useLanguageStore();
  const langCode = language === 'en' ? 'en-US' : 'ko-KR';
  const KEYWORD = language === 'en' ? 'mallang' : '말랑아';

  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastMessage = useChatStore((state) => state.updateLastMessage);
  const setIsCapturing = useChatStore((state) => state.setIsCapturing);
  const isCapturing = useChatStore((state) => state.isCapturing);
  const { sendTextToApi } = useGpt({ apiUrl });

  // 🧠 실시간 텍스트 감지
  useEffect(() => {
    if (transcript) {
      lastTextTimeRef.current = Date.now();

      if (isCapturing && keywordIndexRef.current !== -1) {
        const textAfterKeyword = transcript
          .slice(keywordIndexRef.current + KEYWORD.length)
          .trim();
        setCapturedText(textAfterKeyword);
        updateLastMessage(textAfterKeyword);
      }
    }
  }, [transcript, isCapturing, updateLastMessage]);

  // 🔁 일정 시간 텍스트 없으면 인식 종료 및 처리
  useEffect(() => {
    if (!isCapturing) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastTextTimeRef.current > 2000) {
        setIsCapturing(false);
        setIsProcessing(false);

        if (capturedText) {
          sendTextToApi(capturedText).catch((err) => {
            console.error('Error processing voice input:', err);
          });
        }

        resetTranscript();
        keywordIndexRef.current = -1;
        setCapturedText('');
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [isCapturing, capturedText, sendTextToApi]);

  // 🎯 키워드 감지
  useEffect(() => {
    if (!transcript || isProcessing) return;

    const keywordIndex = transcript.indexOf(KEYWORD);
    if (keywordIndex !== -1 && keywordIndexRef.current === -1) {
      setIsProcessing(true);
      setDetectedCount((prev) => prev + 1);
      setIsCapturing(true);
      setCapturedText('');
      lastTextTimeRef.current = Date.now();
      keywordIndexRef.current = keywordIndex;

      addMessage({
        text: '',
        isUser: true,
        timestamp: Date.now(),
      });
    }
  }, [transcript, isProcessing]);

  // ✅ 언어 변경 또는 덮개 해제 시 마이크 재시작
  useEffect(() => {
    if (!isCovered) {
      SpeechRecognition.stopListening().then(() => {
        SpeechRecognition.startListening({
          continuous: true,
          language: langCode,
        });
      });
    }
  }, [language, isCovered]);

  // 🔇 언마운트 시 마이크 정지
  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  return (
    <div className='p-6 h-fit rounded-xl shadow-lg bg-white text-center'>
      {isCovered && (
        <button
          className="
            absolute top-0 left-0 w-screen h-screen p-6
            flex flex-col items-center justify-center
            cursor-pointer
            bg-white/70
            border-4 border-indigo-500
            rounded-none
            shadow-xl
            backdrop-blur-md
          "
          onClick={() => {
            setIsCovered(false); // ✅ 마이크 재시작은 useEffect가 담당
          }}
        >
          <div className="absolute top-6 left-6 text-2xl font-bold text-indigo-600 select-none drop-shadow-md">
            Mallang Order
          </div>

          <div className="absolute top-6 right-6">
            <LanguageSelector />
          </div>

          <img
            src="/logoT.png"
            alt="말랑 로고"
            width={300}
            height={300}
            className="mb-10 rounded-lg shadow-lg"
          />

          <p className="text-[2.5rem] sm:text-4xl md:text-5xl font-bold text-indigo-600 text-center animate-pulse select-none leading-tight whitespace-pre-line">
            {language === 'en'
              ? 'Touch the screen\nto start your order'
              : '화면을 터치해\n주문을 시작하세요'}
          </p>
        </button>
      )}

      <div className='flex flex-col items-center'>
        <p className='text-sm text-gray-600'>
          {listening
            ? language === 'en'
              ? 'Listening for the keyword...'
              : '키워드 말랑아 감지중...'
            : language === 'en'
            ? 'Waiting...'
            : '대기 중'}
        </p>
        <p>{transcript}</p>
      </div>

      {isCapturing && (
        <div className='bg-blue-50 rounded-lg border bg-ml-yellow-light border border-ml-yellow p-2 mt-2'>
          <p className='text-sm text-black mb-1'>
            {language === 'en' ? 'Recognizing speech...' : '음성 인식 중...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Voice;
