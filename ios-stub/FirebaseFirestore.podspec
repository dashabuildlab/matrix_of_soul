# Stub podspec for FirebaseFirestore.
#
# FirebaseAnalytics/IdentitySupport declares FirebaseFirestore as a transitive
# dependency, which causes CocoaPods to clone the entire firebase-ios-sdk
# monorepo (~2 GB of Firestore C++ source) and exhaust EAS build machine disk.
#
# We never call Firestore APIs directly (no @react-native-firebase/firestore),
# so this empty stub satisfies the pod version constraint without downloading
# or compiling anything.

Pod::Spec.new do |s|
  s.name             = 'FirebaseFirestore'
  s.version          = '12.10.0'
  s.summary          = 'Firebase Firestore stub (no-op for builds that do not use Firestore)'
  s.homepage         = 'https://firebase.google.com'
  s.license          = { :type => 'Apache-2.0' }
  s.author           = { 'Google' => 'firebase-ios-sdk-dev@google.com' }
  s.source           = { :git => '' }
  s.ios.deployment_target = '15.0'
  # No source_files, no vendored_frameworks, no dependencies.
  # This stub intentionally contains no code.
end
