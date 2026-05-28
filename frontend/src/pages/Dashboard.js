import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Briefcase, Upload, Search, Star, FileText, LogOut, Bookmark, Briefcase as BriefcaseIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [interests, setInterests] = useState({ skills: [], job_types: [], locations: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("us");
  const [jobs, setJobs] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [jobTypeInput, setJobTypeInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    fetchUser();
    fetchResume();
    fetchInterests();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  };

  const fetchResume = async () => {
    try {
      const response = await axios.get(`${API}/resume/current`, { withCredentials: true });
      setResume(response.data);
    } catch (error) {
      console.error("Failed to fetch resume", error);
    }
  };

  const fetchInterests = async () => {
    try {
      const response = await axios.get(`${API}/interests`, { withCredentials: true });
      if (response.data) {
        setInterests(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch interests", error);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/resume/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Resume uploaded successfully!");
      setResume(response.data);
      if (response.data.extracted_skills?.length > 0) {
        setInterests(prev => ({
          ...prev,
          skills: [...new Set([...prev.skills, ...response.data.extracted_skills])]
        }));
      }
      fetchResume();
    } catch (error) {
      toast.error("Failed to upload resume");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const addSkill = () => {
    if (skillInput.trim() && !interests.skills.includes(skillInput.trim())) {
      setInterests(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setInterests(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addJobType = () => {
    if (jobTypeInput.trim() && !interests.job_types.includes(jobTypeInput.trim())) {
      setInterests(prev => ({ ...prev, job_types: [...prev.job_types, jobTypeInput.trim()] }));
      setJobTypeInput("");
    }
  };

  const removeJobType = (type) => {
    setInterests(prev => ({ ...prev, job_types: prev.job_types.filter(t => t !== type) }));
  };

  const addLocation = () => {
    if (locationInput.trim() && !interests.locations.includes(locationInput.trim())) {
      setInterests(prev => ({ ...prev, locations: [...prev.locations, locationInput.trim()] }));
      setLocationInput("");
    }
  };

  const removeLocation = (loc) => {
    setInterests(prev => ({ ...prev, locations: prev.locations.filter(l => l !== loc) }));
  };

  const saveInterests = async () => {
    try {
      await axios.post(`${API}/interests`, interests, { withCredentials: true });
      toast.success("Preferences saved!");
    } catch (error) {
      toast.error("Failed to save preferences");
      console.error(error);
    }
  };

  const searchJobs = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`${API}/jobs/search`, {
        params: { query: searchQuery, location: searchLocation },
        withCredentials: true
      });
      setJobs(response.data.results || []);
      toast.success(`Found ${response.data.count || 0} jobs`);
    } catch (error) {
      toast.error("Failed to search jobs");
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const saveJob = async (job) => {
    try {
      await axios.post(`${API}/jobs/save`, { job_data: job }, { withCredentials: true });
      toast.success("Job saved!");
    } catch (error) {
      toast.error("Failed to save job");
      console.error(error);
    }
  };

  const applyToJob = async (job) => {
    try {
      await axios.post(`${API}/jobs/apply`, { job_id: job.id, job_data: job }, { withCredentials: true });
      toast.success("Application recorded!");
    } catch (error) {
      toast.error("Failed to apply");
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  const getMatchScoreClass = (score) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-blue-600" />
              <span className="text-lg font-bold tracking-tight text-gray-900">JobMatch AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/saved-jobs")}
                data-testid="saved-jobs-button"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Bookmark className="w-5 h-5 mr-2" />
                Saved
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/applications")}
                data-testid="applications-button"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <BriefcaseIcon className="w-5 h-5 mr-2" />
                Applications
              </Button>
              <div className="flex items-center gap-3">
                {user && (
                  <div className="flex items-center gap-2">
                    {user.picture && (
                      <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                    )}
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Resume Upload */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Your Resume
            </h2>
            {!resume ? (
              <div
                data-testid="resume-dropzone"
                className={`resume-dropzone rounded-md p-12 text-center cursor-pointer ${
                  dragOver ? "dragover" : ""
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("resume-input").click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-base font-medium text-gray-900 mb-2">Upload your resume</p>
                <p className="text-sm text-gray-600 mb-4">Drag and drop or click to browse</p>
                <p className="text-xs text-gray-500">Supports PDF and DOCX files</p>
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="resume-file-input"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md p-4" data-testid="resume-uploaded">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">{resume.original_filename || resume.filename}</p>
                    <p className="text-sm text-gray-600">Uploaded successfully</p>
                    {resume.extracted_skills && (
                      <p className="text-xs text-gray-500 mt-2">Extracted {resume.extracted_skills.length} skills</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("resume-input").click()}
                    data-testid="replace-resume-button"
                  >
                    Replace
                  </Button>
                </div>
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
            {uploading && (
              <div className="mt-4 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Analyzing resume...</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Skills Added</p>
                <p className="text-2xl font-bold text-blue-600">{interests.skills.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Job Types</p>
                <p className="text-2xl font-bold text-blue-600">{interests.job_types.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Locations</p>
                <p className="text-2xl font-bold text-blue-600">{interests.locations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-gray-200 rounded-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Skills */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">Skills</label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Add skill"
                  data-testid="skill-input"
                  className="flex-1"
                />
                <Button onClick={addSkill} size="sm" data-testid="add-skill-button">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.skills.map((skill, i) => (
                  <Badge
                    key={i}
                    className="skill-tag bg-gray-100 text-gray-700 border border-gray-200 cursor-pointer"
                    onClick={() => removeSkill(skill)}
                    data-testid={`skill-tag-${i}`}
                  >
                    {skill} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Job Types */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">Job Types</label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={jobTypeInput}
                  onChange={(e) => setJobTypeInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addJobType()}
                  placeholder="e.g., Full-time"
                  data-testid="job-type-input"
                  className="flex-1"
                />
                <Button onClick={addJobType} size="sm" data-testid="add-job-type-button">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.job_types.map((type, i) => (
                  <Badge
                    key={i}
                    className="skill-tag bg-gray-100 text-gray-700 border border-gray-200 cursor-pointer"
                    onClick={() => removeJobType(type)}
                    data-testid={`job-type-tag-${i}`}
                  >
                    {type} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">Preferred Locations</label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addLocation()}
                  placeholder="e.g., New York"
                  data-testid="location-input"
                  className="flex-1"
                />
                <Button onClick={addLocation} size="sm" data-testid="add-location-button">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.locations.map((loc, i) => (
                  <Badge
                    key={i}
                    className="skill-tag bg-gray-100 text-gray-700 border border-gray-200 cursor-pointer"
                    onClick={() => removeLocation(loc)}
                    data-testid={`location-tag-${i}`}
                  >
                    {loc} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={saveInterests}
              data-testid="save-preferences-button"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Preferences
            </Button>
          </div>
        </div>

        {/* Job Search */}
        <div className="bg-white border border-gray-200 rounded-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Search Jobs
          </h2>
          <div className="flex gap-4 mb-6">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchJobs()}
              placeholder="Job title, keywords, or company"
              data-testid="search-query-input"
              className="flex-1"
            />
            <Input
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Location code (e.g., us, gb)"
              data-testid="search-location-input"
              className="w-48"
            />
            <Button
              onClick={searchJobs}
              disabled={searching}
              data-testid="search-jobs-button"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Job Results */}
          <div className="space-y-4" data-testid="job-results">
            {jobs.length === 0 && !searching && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Search for jobs to see AI-powered matches</p>
              </div>
            )}
            {jobs.map((job, i) => (
              <div
                key={i}
                className="job-card border border-gray-200 rounded-md p-6"
                data-testid={`job-card-${i}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{job.company?.display_name || "Company"}</p>
                    <p className="text-sm text-gray-500">{job.location?.display_name || "Location not specified"}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className={`w-5 h-5 ${getMatchScoreClass(job.match_score)}`} />
                      <span className={`text-lg font-bold ${getMatchScoreClass(job.match_score)}`}>
                        {job.match_score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Match Score</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {job.description?.replace(/<[^>]*>/g, '').substring(0, 200)}...
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveJob(job)}
                    data-testid={`save-job-${i}`}
                  >
                    <Bookmark className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyToJob(job)}
                    data-testid={`apply-job-${i}`}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Apply
                  </Button>
                  {job.redirect_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(job.redirect_url, '_blank')}
                      data-testid={`view-job-${i}`}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;