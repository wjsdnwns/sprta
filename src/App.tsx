import React, { useState, useEffect, useCallback } from "react";

// Firebase import
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth"; // signInWithCustomToken은 Canvas 환경에서만 사용됩니다.
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

function App() {
  // -----------------------------------------------------------------------------
  // ⭐ 중요: CodeSandbox에서 Firebase를 사용하려면 여기에 당신의 Firebase 프로젝트 설정을 붙여넣어야 합니다!
  // 1. Firebase 웹사이트 (console.firebase.google.com)에 접속하여 Google 계정으로 로그인하세요.
  // 2. 새로운 프로젝트를 만들거나 기존 프로젝트를 선택하세요.
  // 3. 프로젝트 개요 페이지에서 '웹 앱 추가' 아이콘 (</>)을 클릭하세요.
  // 4. 앱 등록 단계를 진행하고, 'Firebase SDK snippet' 섹션에서 'Config'를 선택하여 JSON 객체를 복사하세요.
  // 5. 복사한 JSON 객체를 아래 YOUR_FIREBASE_CONFIG = { ... }; 부분에 붙여넣으세요.
  //    예시: { apiKey: "AIza...", authDomain: "your-project.firebaseapp.com", ... }
  // -----------------------------------------------------------------------------
  const YOUR_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCEIyZ6Yh637vfeXxRUldm-QI3yMtSOj6s",
    authDomain: "day-of-day-f7f56.firebaseapp.com",
    projectId: "day-of-day-f7f56",
    storageBucket: "day-of-day-f7f56.firebasestorage.app",
    messagingSenderId: "851435676723",
    appId: "1:851435676723:web:32c8855dde20151ce62f46",
    measurementId: "G-VZVPJYBEG8",
  };

  // Firebase config의 appId를 사용하거나, 없을 경우 기본값으로 설정합니다.
  // 이 값은 Firestore 컬렉션 경로에 사용됩니다.
  const appIdForFirestore =
    YOUR_FIREBASE_CONFIG.appId || "default-codesandbox-app-id";

  // Firebase 관련 상태 변수
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 학생 입력 폼 관련 상태 변수
  const [studentIdName, setStudentIdName] = useState(""); // 학번+이름 입력 필드
  const [selectedCipOption, setSelectedCipOption] = useState("123"); // 기본값: CIP 1,2,3차
  const [reason, setReason] = useState("");

  // 오늘 날짜 상태 (YYYY-MM-DD 형식)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [currentDate, setCurrentDate] = useState(getTodayDate());

  // 출결 현황 데이터
  const allStudentsList = [
    "10401 강유진",
    "10402 구동하",
    "10403 김민섭",
    "10404 김민성",
    "10405 김민재",
    "10406 김준혁",
    "10407 김현서",
    "10408 민승기",
    "10409 박시후",
    "10410 박재준",
    "10411 박준교",
    "10412 박준성",
    "10413 박지훈",
    "10414 박찬",
    "10415 손은성",
    "10416 손정우",
    "10417 신윤송",
    "10418 심동원",
    "10419 엄성율",
    "10420 오승민",
    "10421 우지환",
    "10422 윤서준",
    "10423 윤수찬",
    "10424 이규성",
    "10425 이우찬",
    "10426 장진우",
    "10427 전우준",
    "10428 전재신",
    "10429 전재원",
    "10430 조민성",
    "10431 조한겸",
    "10432 최현서",
    "10433 한영준",
    "10434 한지완",
    "10435 허선호",
  ];
  const [absentStudentsData, setAbsentStudentsData] = useState([]);

  // UI 메시지 모달 상태
  const [messageModal, setMessageModal] = useState({
    isVisible: false,
    title: "",
    content: "",
  });

  const showMessageModal = (title, content) => {
    setMessageModal({
      isVisible: true,
      title: title,
      content: content,
    });
  };

  const closeMessageModal = () => {
    setMessageModal({
      isVisible: false,
      title: "",
      content: "",
    });
  };

  // Firebase 초기화 및 인증
  useEffect(() => {
    // Firebase 설정이 유효한지 간단하게 확인
    if (!YOUR_FIREBASE_CONFIG.apiKey || !YOUR_FIREBASE_CONFIG.projectId) {
      console.warn(
        "Firebase 설정이 완료되지 않았습니다. YOUR_FIREBASE_CONFIG를 채워주세요."
      );
      showMessageModal(
        "설정 필요",
        "Firebase 설정이 완료되지 않았습니다. CodeSandbox 코드의 주석을 확인하여 설정해주세요."
      );
      return; // 설정이 없으면 Firebase 초기화 중단
    }

    try {
      const app = initializeApp(YOUR_FIREBASE_CONFIG);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // CodeSandbox 환경에서는 커스텀 토큰이 없으므로 익명 로그인
          await signInAnonymously(firebaseAuth);
          setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID()); // 익명 로그인 후 userId 설정
        }
        setIsAuthReady(true); // 인증 준비 완료
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase 초기화 또는 인증 중 오류 발생:", error);
      showMessageModal(
        "오류",
        "Firebase 서비스 초기화에 실패했습니다. 콘솔을 확인해주세요."
      );
    }
  }, [YOUR_FIREBASE_CONFIG]); // Firebase 설정이 변경될 때마다 재실행

  // Firestore 데이터 실시간 업데이트 (onSnapshot) - 날짜 필터링 추가
  useEffect(() => {
    if (!db || !isAuthReady) return;

    // 위에 정의된 appIdForFirestore를 사용합니다.
    const absentStudentsColRef = collection(
      db,
      `artifacts/${appIdForFirestore}/public/data/absentStudents`
    );

    const q = query(absentStudentsColRef, where("date", "==", currentDate));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        data.sort(
          (a, b) =>
            (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0)
        );
        setAbsentStudentsData(data);
      },
      (error) => {
        console.error("Firestore 데이터 가져오기 오류:", error);
        showMessageModal("오류", "출결 데이터를 불러오는 데 실패했습니다.");
      }
    );

    return () => unsubscribe();
  }, [db, isAuthReady, currentDate, appIdForFirestore]); // appIdForFirestore가 변경될 때마다 재실행

  // 야자 불참 제출 처리 함수
  const handleSubmit = async () => {
    if (!studentIdName.trim()) {
      showMessageModal("입력 오류", "학번과 이름을 입력해주세요.");
      return;
    }
    if (!allStudentsList.includes(studentIdName.trim())) {
      showMessageModal(
        "입력 오류",
        "등록되지 않은 학번 또는 이름입니다. 정확히 입력해주세요."
      );
      return;
    }
    if (!selectedCipOption) {
      showMessageModal("입력 오류", "빠질 야자 시간을 선택해주세요.");
      return;
    }
    if (!reason.trim()) {
      showMessageModal("입력 오류", "사유를 입력해주세요.");
      return;
    }

    if (!db) {
      showMessageModal(
        "오류",
        "데이터베이스가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    try {
      // 위에 정의된 appIdForFirestore를 사용합니다.
      const absentStudentsColRef = collection(
        db,
        `artifacts/${appIdForFirestore}/public/data/absentStudents`
      );

      await addDoc(absentStudentsColRef, {
        studentIdName: studentIdName.trim(),
        cipOption: selectedCipOption,
        reason: reason.trim(),
        date: currentDate,
        timestamp: serverTimestamp(),
        submittedBy: userId,
      });

      setStudentIdName("");
      setSelectedCipOption("123");
      setReason("");
      showMessageModal(
        "제출 완료",
        `${studentIdName.trim()} 학생의 야자 불참 신청이 완료되었습니다.`
      );
    } catch (e) {
      console.error("Firestore에 문서 추가 중 오류 발생:", e);
      showMessageModal(
        "오류",
        "신청 제출 중 문제가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  // 야자 중인 학생 목록 계산 (불참 학생 데이터를 기반으로)
  const attendingStudentsDisplay = allStudentsList
    .filter(
      (student) =>
        !absentStudentsData.some((absent) => absent.studentIdName === student)
    )
    .sort();

  // 불참 학생 목록 표시 형식 지정
  const absentStudentsDisplay = absentStudentsData
    .map((absent) => {
      let cipText = "";
      if (absent.cipOption === "123") {
        cipText = "CIP 1,2,3차";
      } else if (absent.cipOption === "23") {
        cipText = "CIP 2,3차";
      }
      return `${absent.studentIdName} (${cipText} - ${absent.reason})`;
    })
    .sort();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans">
      {/* Tailwind CSS CDN */}
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        {`
                /* Tailwind 기본 폰트인 Inter를 사용합니다. 추가 커스텀 스타일이 필요하다면 여기에 작성 */
                `}
      </style>

      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <h1 className="text-4xl font-extrabold text-blue-800 mb-8 text-center">
        야자 출결 관리 시스템
      </h1>

      {/* 현재 앱 ID 및 사용자 ID 표시 (선생님/관리자 확인용) */}
      <div className="text-sm text-gray-600 mb-6 bg-white p-3 rounded-lg shadow-sm">
        <p>
          <strong>앱 ID:</strong> {appIdForFirestore}
        </p>
        <p>
          <strong>사용자 ID:</strong> {userId ? userId : "인증 중..."}
        </p>
        <p className="mt-2 text-base">
          <strong>현재 날짜:</strong> {currentDate}
        </p>
      </div>

      {/* 학생용 출결 기록 폼 */}
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg mb-10 border border-blue-200">
        <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          학생용 출결 기록
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          종례 후 빠질 야자 시간을 선택하고 사유를 입력해주세요.
        </p>

        <div className="mb-5">
          <label
            htmlFor="studentIdName"
            className="block text-gray-700 text-lg font-semibold mb-2"
          >
            학번과 이름:
          </label>
          <input
            type="text"
            id="studentIdName"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="예: 10427 전우준"
            value={studentIdName}
            onChange={(e) => setStudentIdName(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <p className="text-gray-700 text-lg font-semibold mb-3">
            빠질 야자 시간:
          </p>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="cip123"
                name="cipOptions"
                value="123"
                checked={selectedCipOption === "123"}
                onChange={(e) => setSelectedCipOption(e.target.value)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
              />
              <label htmlFor="cip123" className="ml-3 text-gray-700 text-base">
                CIP 1차, 2차, 3차 모두
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="cip23"
                name="cipOptions"
                value="23"
                checked={selectedCipOption === "23"}
                onChange={(e) => setSelectedCipOption(e.target.value)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
              />
              <label htmlFor="cip23" className="ml-3 text-gray-700 text-base">
                CIP 2차, 3차만
              </label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="reason"
            className="block text-gray-700 text-lg font-semibold mb-2"
          >
            사유:
          </label>
          <textarea
            id="reason"
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-200 resize-y"
            placeholder="자세한 사유를 입력하세요 (예: 병원 진료, 학원 보충, 가족 행사 등)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          ></textarea>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-xl font-bold hover:bg-blue-700 transition duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
          disabled={!isAuthReady}
        >
          {isAuthReady ? "제출하기" : "준비 중..."}
        </button>
      </div>

      <hr className="w-4/5 border-t border-gray-300 my-10" />

      {/* 선생님/학생용 출결 현황 */}
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg border border-green-200">
        <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">
          선생님/학생용 출결 현황
        </h2>
        <p className="text-gray-600 mb-8 text-center">
          현재 야자 중인 학생과 빠진 학생을 확인할 수 있습니다. 실시간으로
          업데이트됩니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 야자 중인 학생 목록 */}
          <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
            <h3 className="text-2xl font-semibold text-green-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 mr-2 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              야자 중인 학생 ({attendingStudentsDisplay.length}명)
            </h3>
            <ul className="space-y-3">
              {attendingStudentsDisplay.length === 0 ? (
                <li className="text-gray-500 italic">
                  현재 야자 중인 학생이 없습니다.
                </li>
              ) : (
                attendingStudentsDisplay.map((student, index) => (
                  <li
                    key={index}
                    className="bg-white p-3 rounded-md shadow-sm border border-gray-100 text-gray-800 text-lg"
                  >
                    {student}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* 야자 불참 학생 목록 */}
          <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
            <h3 className="text-2xl font-semibold text-red-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 mr-2 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              야자 불참 학생 ({absentStudentsDisplay.length}명)
            </h3>
            <ul className="space-y-3">
              {absentStudentsDisplay.length === 0 ? (
                <li className="text-gray-500 italic">
                  현재 야자 불참 신청 학생이 없습니다.
                </li>
              ) : (
                absentStudentsDisplay.map((info, index) => (
                  <li
                    key={index}
                    className="bg-white p-3 rounded-md shadow-sm border border-gray-100 text-gray-800 text-lg"
                  >
                    {info}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 커스텀 메시지 모달 (Alert 대신) */}
      {messageModal.isVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {messageModal.title}
            </h3>
            <p className="text-gray-700 mb-6">{messageModal.content}</p>
            <button
              onClick={closeMessageModal}
              className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
