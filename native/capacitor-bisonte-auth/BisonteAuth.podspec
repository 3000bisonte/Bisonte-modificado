Pod::Spec.new do |s|
  s.name = 'BisonteAuth'
  s.version = '0.1.0'
  s.summary = 'Bisonte Google Sign-In via AppAuth'
  s.license = { :type => 'MIT' }
  s.author = 'Bisonte'
  s.homepage = 'https://www.bisonteapp.com'
  s.source = { :path => '.' }
  s.source_files = 'ios/**/*.{swift,h,m}'
  s.ios.deployment_target = '13.0'
  s.dependency 'Capacitor'
  s.dependency 'AppAuth', '~> 1.6'
end
