import Foundation
import React

@objc(ASRModule)
class ASRModule: RCTEventEmitter {

  private let asrService = ASRService()
  private var hasListeners = false

  // 让 RN 在主线程初始化（ASR 涉及音频）
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // JS 端可以监听到的事件列表
  override func supportedEvents() -> [String]! {
    return ["onASRPartialResult", "onASRFinalResult", "onASRError"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  // 请求语音识别权限，返回一个 Promise<boolean>
  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    asrService.requestAuthorization { ok in
      if ok {
        resolve(true)
      } else {
        let error = NSError(domain: "ASRModule",
                            code: 1,
                            userInfo: [NSLocalizedDescriptionKey: "Speech recognition not authorized"])
        reject("E_ASR_AUTH", "Speech recognition not authorized", error)
      }
    }
  }

  // 开始识别：通过事件把中间结果 / 最终结果发到 JS
  @objc
  func start() {
    asrService.startRecognition(
      onResult: { [weak self] text in
        guard let self = self, self.hasListeners else { return }
        self.sendEvent(withName: "onASRPartialResult", body: ["text": text])
      },
      onFinalResult: { [weak self] text in
        guard let self = self, self.hasListeners else { return }
        self.sendEvent(withName: "onASRFinalResult", body: ["text": text])
      }
    )
  }

  // 停止识别
  @objc
  func stop() {
    asrService.stopRecognition()
  }

  // 暂停 / 恢复
  @objc
  func pause() {
    asrService.pauseRecognition()
  }

  @objc
  func resume() {
    asrService.resumeRecognition()
  }
}
