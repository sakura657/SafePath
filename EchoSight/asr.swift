import Foundation
import Speech
import AVFoundation
import Combine

/// ASR语音识别服务类
/// 提供实时语音转文字、权限管理、暂停/恢复等功能
class ASRService: ObservableObject {
    
    // MARK: - Published Properties
    
    /// 是否正在监听
    @Published var isListening: Bool = false
    
    /// 是否已授权
    @Published var isAuthorized: Bool = false
    
    /// 当前识别的文本（实时更新）
    @Published var currentText: String = ""
    
    /// 识别错误信息
    @Published var errorMessage: String?
    
    // MARK: - Private Properties
    
    /// 语音识别器
    private var speechRecognizer: SFSpeechRecognizer?
    
    /// 识别请求
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    
    /// 识别任务
    private var recognitionTask: SFSpeechRecognitionTask?
    
    /// 音频引擎
    private let audioEngine = AVAudioEngine()
    
    /// 识别结果回调
    private var onResultCallback: ((String) -> Void)?
    
    /// 识别完成回调
    private var onFinalResultCallback: ((String) -> Void)?
    
    /// 是否已暂停
    private var isPaused: Bool = false
    
    /// 音频会话是否已配置
    private var audioSessionConfigured: Bool = false
    
    /// 识别语言（默认英文）
    private var recognitionLocale: Locale = Locale(identifier: "en-US")
    
    /// 是否启用设备端识别（iOS 13+）
    private var useOnDeviceRecognition: Bool = true
    
    // MARK: - Initialization
    
    /// 初始化ASR服务
    /// - Parameters:
    ///   - locale: 识别语言，默认为英文
    ///   - useOnDevice: 是否优先使用设备端识别
    init(locale: Locale = Locale(identifier: "en-US"), useOnDevice: Bool = true) {
        self.recognitionLocale = locale
        self.useOnDeviceRecognition = useOnDevice
        self.speechRecognizer = SFSpeechRecognizer(locale: locale)
        self.speechRecognizer?.delegate = self
    }
    
    // MARK: - Public Methods
    
    /// 请求语音识别权限
    /// - Parameter completion: 授权结果回调
    func requestAuthorization(completion: @escaping (Bool) -> Void) {
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            DispatchQueue.main.async {
                guard let self = self else { return }
                
                switch authStatus {
                case .authorized:
                    self.isAuthorized = true
                    print("✅ ASR权限已授权")
                    completion(true)
                    
                case .denied:
                    self.isAuthorized = false
                    self.errorMessage = "语音识别权限被拒绝，请在设置中开启"
                    print("❌ ASR权限被拒绝")
                    completion(false)
                    
                case .restricted:
                    self.isAuthorized = false
                    self.errorMessage = "语音识别在此设备上受限"
                    print("⚠️ ASR权限受限")
                    completion(false)
                    
                case .notDetermined:
                    self.isAuthorized = false
                    self.errorMessage = "语音识别权限未确定"
                    print("❓ ASR权限未确定")
                    completion(false)
                    
                @unknown default:
                    self.isAuthorized = false
                    completion(false)
                }
            }
        }
    }
    
    /// 开始识别
    /// - Parameters:
    ///   - onResult: 实时识别结果回调（部分结果）
    ///   - onFinalResult: 最终识别结果回调
    func startRecognition(
        onResult: ((String) -> Void)? = nil,
        onFinalResult: ((String) -> Void)? = nil
    ) {
        // 检查权限
        guard isAuthorized else {
            errorMessage = "未获得语音识别权限"
            print("❌ 未授权，无法开始识别")
            return
        }
        
        // 如果已在监听，先停止
        if isListening {
            stopRecognition()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.startRecognition(onResult: onResult, onFinalResult: onFinalResult)
            }
            return
        }
        
        // 保存回调
        self.onResultCallback = onResult
        self.onFinalResultCallback = onFinalResult
        
        // 配置音频会话
        configureAudioSession()
        
        // 创建识别请求
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            errorMessage = "无法创建识别请求"
            return
        }
        
        // 配置识别请求
        recognitionRequest.shouldReportPartialResults = true
        
        // 启用设备端识别（如果支持）
        if #available(iOS 13.0, *), useOnDeviceRecognition {
            recognitionRequest.requiresOnDeviceRecognition = true
        }
        
        // iOS 16+ 可选配置
        if #available(iOS 16.0, *) {
            recognitionRequest.addsPunctuation = false
        }
        
        // 获取音频输入节点
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        // 安装音频tap
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            guard let self = self else { return }
            self.recognitionRequest?.append(buffer)
        }
        
        // 准备并启动音频引擎
        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            errorMessage = "音频引擎启动失败: \(error.localizedDescription)"
            print("❌ 音频引擎启动失败: \(error)")
            return
        }
        
        // 开始识别任务
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            if let error = error {
                self.handleRecognitionError(error)
                return
            }
            
            guard let result = result else { return }
            
            let transcription = result.bestTranscription.formattedString
            
            DispatchQueue.main.async {
                self.currentText = transcription
                self.onResultCallback?(transcription)
            }
            
            // 如果是最终结果
            if result.isFinal {
                DispatchQueue.main.async {
                    self.onFinalResultCallback?(transcription)
                    // 自动重启以保持连续识别
                    if !self.isPaused {
                        self.restartRecognition()
                    }
                }
            }
        }
        
        DispatchQueue.main.async {
            self.isListening = true
            self.errorMessage = nil
            print("🎤 开始语音识别")
        }
    }
    
    /// 停止识别
    func stopRecognition() {
        guard isListening else { return }
        
        // 移除音频tap
        audioEngine.inputNode.removeTap(onBus: 0)
        
        // 停止音频引擎
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.reset()
        }
        
        // 结束识别请求
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        
        // 取消识别任务
        recognitionTask?.cancel()
        recognitionTask = nil
        
        DispatchQueue.main.async {
            self.isListening = false
            self.currentText = ""
            print("🛑 停止语音识别")
        }
    }
    
    /// 暂停识别（用于避免捕获TTS输出）
    func pauseRecognition() {
        guard isListening else { return }
        isPaused = true
        stopRecognition()
        print("⏸️ 暂停语音识别")
    }
    
    /// 恢复识别
    func resumeRecognition() {
        guard isPaused else { return }
        isPaused = false
        
        // 延迟恢复以确保TTS完全结束
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.startRecognition(
                onResult: self.onResultCallback,
                onFinalResult: self.onFinalResultCallback
            )
            print("▶️ 恢复语音识别")
        }
    }
    
    /// 清除当前识别的文本
    func clearText() {
        DispatchQueue.main.async {
            self.currentText = ""
        }
    }
    
    /// 设置识别语言
    /// - Parameter locale: 语言区域
    func setLocale(_ locale: Locale) {
        self.recognitionLocale = locale
        self.speechRecognizer = SFSpeechRecognizer(locale: locale)
        self.speechRecognizer?.delegate = self
    }
    
    // MARK: - Private Methods
    
    /// 配置音频会话
    private func configureAudioSession() {
        guard !audioSessionConfigured else { return }
        
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            audioSessionConfigured = true
            print("✅ 音频会话配置成功")
        } catch {
            print("❌ 音频会话配置失败: \(error.localizedDescription)")
            errorMessage = "音频会话配置失败"
        }
    }
    
    /// 处理识别错误
    private func handleRecognitionError(_ error: Error) {
        let nsError = error as NSError
        
        DispatchQueue.main.async {
            switch nsError.code {
            case 216: // SFSpeechRecognizerErrorCode.notAvailable
                self.errorMessage = "语音识别服务不可用"
                self.stopRecognition()
                
            case 201: // SFSpeechRecognizerErrorCode.recognitionTaskUnavailable
                self.errorMessage = "识别任务不可用"
                self.stopRecognition()
                
            default:
                // 其他错误可能是临时性的，尝试重启
                print("⚠️ 识别错误: \(error.localizedDescription)")
                if self.isListening && !self.isPaused {
                    self.restartRecognition()
                }
            }
        }
    }
    
    /// 重启识别（用于连续识别）
    private func restartRecognition() {
        stopRecognition()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.startRecognition(
                onResult: self.onResultCallback,
                onFinalResult: self.onFinalResultCallback
            )
        }
    }
    
    deinit {
        stopRecognition()
    }
}

// MARK: - SFSpeechRecognizerDelegate

extension ASRService: SFSpeechRecognizerDelegate {
    func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
        DispatchQueue.main.async {
            if !available {
                self.errorMessage = "语音识别服务当前不可用"
                if self.isListening {
                    self.stopRecognition()
                }
            }
        }
    }
}

