import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Briefcase, LogOut, CheckCircle, Home, Bookmark } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Applications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    fetchApplications();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/jobs/applications`, { withCredentials: true });
      setApplications(response.data);
    } catch (error) {
      toast.error("Failed to fetch applications");
      console.error(error);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                onClick={() => navigate("/dashboard")}
                data-testid="dashboard-button"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Home className="w-5 h-5 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/saved-jobs")}
                data-testid="saved-jobs-button"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Bookmark className="w-5 h-5 mr-2" />
                Saved
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            My Applications
          </h1>
          <p className="text-gray-600">Track all your job applications in one place</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-md">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-6">Start applying to jobs that match your profile</p>
            <Button
              onClick={() => navigate("/dashboard")}
              data-testid="go-to-dashboard-button"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Search Jobs
            </Button>
          </div>
        ) : (
          <div className="space-y-4" data-testid="applications-list">
            {applications.map((app, i) => {
              const job = app.job_data;
              return (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-md p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                  data-testid={`application-${i}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{job.company?.display_name || "Company"}</p>
                      <p className="text-sm text-gray-500">{job.location?.display_name || "Location not specified"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Applied on</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(app.applied_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {job.description?.replace(/<[^>]*>/g, '').substring(0, 200)}...
                  </p>
                  <div className="flex gap-2">
                    {job.redirect_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(job.redirect_url, '_blank')}
                        data-testid={`view-application-${i}`}
                      >
                        View Job Posting
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;