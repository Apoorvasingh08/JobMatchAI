import { useState } from "react";
import { Briefcase, Upload, Target, TrendingUp, ArrowRight, Search } from "lucide-react";
import { Button } from "../components/ui/button";

const Landing = () => {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold tracking-tight text-gray-900">JobMatch AI</span>
            </div>
            <Button 
              onClick={handleLogin}
              data-testid="login-button"
              className="bg-blue-600 text-white hover:bg-blue-700 font-medium px-6 rounded-md"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="mb-4">
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-blue-600">AI-POWERED JOB MATCHING</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-black text-gray-900 mb-6">
                Find Your Perfect Job Match
              </h1>
              <p className="text-base leading-relaxed text-gray-600 mb-8 max-w-xl">
                Upload your resume, share your interests, and let our AI analyze thousands of jobs to find the perfect matches for your skills and career goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleLogin}
                  data-testid="hero-get-started-button"
                  className="bg-blue-600 text-white hover:bg-blue-700 font-medium px-8 py-6 text-base rounded-md"
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-200 text-gray-900 hover:bg-gray-50 font-medium px-8 py-6 text-base rounded-md"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="relative">
                <img 
                  src="https://static.prod-images.emergentagent.com/jobs/e22143ca-d3cc-437f-92f2-0a407a71d5a4/images/65b38e6c3063f744c663184429441ba44d11938a46cd2a6575c05c9fd452fe8a.png"
                  alt="AI job matching illustration"
                  className="w-full h-auto rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-blue-600 mb-4 block">HOW IT WORKS</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-bold text-gray-900 mb-4">
              Three Simple Steps to Your Dream Job
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-md p-8" data-testid="feature-upload-resume">
              <div className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center mb-6">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Resume</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Upload your resume in PDF or DOCX format. Our AI will analyze your skills, experience, and qualifications automatically.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-8" data-testid="feature-set-preferences">
              <div className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Set Preferences</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Define your job preferences, desired locations, and career interests to help us find the most relevant opportunities.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-8" data-testid="feature-find-matches">
              <div className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get AI Matches</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Browse AI-ranked job matches with personalized scores. See why each job fits your profile and apply with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-black text-blue-600 mb-2">10k+</div>
              <p className="text-sm text-gray-600 font-medium uppercase tracking-wider">Active Jobs</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-blue-600 mb-2">95%</div>
              <p className="text-sm text-gray-600 font-medium uppercase tracking-wider">Match Accuracy</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-blue-600 mb-2">2k+</div>
              <p className="text-sm text-gray-600 font-medium uppercase tracking-wider">Happy Users</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight font-bold text-white mb-6">
            Ready to Find Your Dream Job?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of professionals who found their perfect job match with AI-powered search.
          </p>
          <Button 
            onClick={handleLogin}
            data-testid="cta-get-started-button"
            className="bg-blue-600 text-white hover:bg-blue-700 font-medium px-8 py-6 text-base rounded-md"
          >
            Get Started for Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              <span className="text-base font-bold text-gray-900">JobMatch AI</span>
            </div>
            <p className="text-sm text-gray-600">© 2026 JobMatch AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;