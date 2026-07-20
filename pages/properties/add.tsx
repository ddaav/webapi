import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  LogOut,
  User,
  CheckCircle,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const PRESET_IMAGES = [
  { path: "/assets/kathmandu_sunset.png", name: "Apartment Sunset" },
  { path: "/assets/nepal_premium_building.png", name: "Premium Building" },
  { path: "/assets/property_1.png", name: "Modern Villa" },
  { path: "/assets/property_2.png", name: "Residential House" },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState<"Kathmandu" | "Lalitpur">("Kathmandu");
  const [type, setType] = useState
    "House" | "Apartment" | "Land" | "Commercial"
  >("House");
  const [beds, setBeds] = useState<number | "">("");
  const [baths, setBaths] = useState<number | "">("");
  const [sqft, setSqft] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].path);
  const [customImage, setCustomImage] = useState("");

  // Amenities
  const [parking, setParking] = useState(true);
  const [security, setSecurity] = useState(false);
  const [balcony, setBalcony] = useState(false);
  const [waterBackup, setWaterBackup] = useState(true);

  // Badges
  const [isAiVerified, setIsAiVerified] = useState(true);
  const [isValuePick, setIsValuePick] = useState(false);
  const [isHotListing, setIsHotListing] = useState(false);

  // Status & Modal States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newPropertyId, setNewPropertyId] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Handle outside click for user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || "U";
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!price || Number(price) <= 0)
      newErrors.price = "Please enter a valid price";
    if (!location.trim()) newErrors.location = "Location is required";
    if (type !== "Land" && (!beds || Number(beds) <= 0))
      newErrors.beds = "Required";
    if (type !== "Land" && (!baths || Number(baths) <= 0))
      newErrors.baths = "Required";
    if (!sqft || Number(sqft) <= 0)
      newErrors.sqft = "Please enter valid area size";
    if (!description.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setIsSubmitting(true);

    const badges: string[] = [];
    if (isAiVerified) badges.push("ai_verified");
    if (isValuePick) badges.push("value_pick");
    if (isHotListing) badges.push("hot_listing");

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          location,
          city,
          price: Number(price),
          type,
          beds: type !== "Land" ? Number(beds) : undefined,
          baths: type !== "Land" ? Number(baths) : undefined,
          sqft: Number(sqft),
          parking,
          security,
          balcony,
          waterBackup,
          images: [customImage.trim() || selectedImage],
          badges,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ submit: data.message || "Failed to post property. Please try again." });
        setIsSubmitting(false);
        return;
      }

      setNewPropertyId(data.property._id);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to create property:", err);
      setErrors({ submit: "Failed to post property. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <div style={{ color: "#64748b", fontWeight: 600 }}>Loading form...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
        color: "#1e293b",
      }}
    >
      {/* Header navbar */}
      <header className="navbar">
        <div className="logo">Gharpurja Nepal</div>
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">
            Properties
          </Link>
          <Link href="/valuation" className="nav-link">
            Valuation
          </Link>
          <Link href="/insights" className="nav-link">
            Insights
          </Link>
          <Link href="/help" className="nav-link">
            Help
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin/users"
              className="nav-link"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Shield size={14} /> Admin
            </Link>
          )}
        </nav>
        <div className="nav-actions">
          <NotificationBell />
          <Link href="/properties/add" className="post-property-btn" style={{ textDecoration: "none" }}>
            Post Property
          </Link>
          <div ref={userMenuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="avatar-btn"
              style={{
                background: "none",
                border: "2px solid var(--border)",
                padding: 0,
              }}
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${user.name} profile`}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div className="profile-avatar-placeholder-nav">
                  {getInitials(user.name)}
                </div>
              )}
            </button>
            {showUserMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  minWidth: "180px",
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "#1e293b",
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#64748b",
                      marginTop: "2px",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    color: "#334155",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    transition: "background 0.15s",
                  }}
                  className="user-menu-item"
                >
                  <User size={15} /> My Profile
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    borderTop: "1px solid var(--border)",
                    transition: "background 0.15s",
                  }}
                  className="user-menu-item"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div
        style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px" }}
      >
        {/* Back Link */}
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "#64748b",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={18} /> Back to Search Feed
        </Link>

        {/* Heading Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 8px 0",
            }}
          >
            Post New Property
          </h1>
          <p style={{ color: "#64748b", fontSize: "1rem", margin: 0 }}>
            List your home, villa, or apartment directly onto Gharpurja search
            feeds.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          {/* Section 1: Core Details */}
          <div>
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "16px",
                color: "#0f172a",
              }}
            >
              1. Basic Information
            </h3>

            <div className="form-group">
              <label className="form-label">Property Title *</label>
              <input
                type="text"
                placeholder="e.g. Sunset Luxury Apartment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`form-input ${errors.title ? "error" : ""}`}
              />
              {errors.title && (
                <div className="form-error-msg">{errors.title}</div>
              )}
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label">Price (NPR) *</label>
                <input
                  type="number"
                  placeholder="e.g. 24000000"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value ? Number(e.target.value) : "")
                  }
                  className={`form-input ${errors.price ? "error" : ""}`}
                />
                {errors.price && (
                  <div className="form-error-msg">{errors.price}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Property Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="form-select"
                >
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Land">Land</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label">Area (sq. ft.) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={sqft}
                  onChange={(e) =>
                    setSqft(e.target.value ? Number(e.target.value) : "")
                  }
                  className={`form-input ${errors.sqft ? "error" : ""}`}
                />
                {errors.sqft && (
                  <div className="form-error-msg">{errors.sqft}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as any)}
                  className="form-select"
                >
                  <option value="Kathmandu">Kathmandu</option>
                  <option value="Lalitpur">Lalitpur</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Location (Area/Neighborhood) *
              </label>
              <input
                type="text"
                placeholder="e.g. Jhamsikhel"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`form-input ${errors.location ? "error" : ""}`}
              />
              {errors.location && (
                <div className="form-error-msg">{errors.location}</div>
              )}
            </div>

            {type !== "Land" && (
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Bedrooms *</label>
                  <input
                    type="number"
                    placeholder="e.g. 3"
                    value={beds}
                    onChange={(e) =>
                      setBeds(e.target.value ? Number(e.target.value) : "")
                    }
                    className={`form-input ${errors.beds ? "error" : ""}`}
                  />
                  {errors.beds && (
                    <div className="form-error-msg">{errors.beds}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Bathrooms *</label>
                  <input
                    type="number"
                    placeholder="e.g. 2"
                    value={baths}
                    onChange={(e) =>
                      setBaths(e.target.value ? Number(e.target.value) : "")
                    }
                    className={`form-input ${errors.baths ? "error" : ""}`}
                  />
                  {errors.baths && (
                    <div className="form-error-msg">{errors.baths}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Image Selection */}
          <div>
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "16px",
                color: "#0f172a",
              }}
            >
              2. Property Media
            </h3>

            <div className="form-group">
              <label className="form-label">
                Choose Preset High-Quality Image *
              </label>
              <div className="preset-images-grid">
                {PRESET_IMAGES.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedImage(img.path);
                      setCustomImage("");
                    }}
                    className={`preset-image-card ${selectedImage === img.path && !customImage ? "selected" : ""}`}
                  >
                    <img src={img.path} alt={img.name} />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label">Or Paste Custom Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Section 3: Amenities & Badges */}
          <div>
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "16px",
                color: "#0f172a",
              }}
            >
              3. Details & Amenities
            </h3>

            <div className="form-group">
              <label className="form-label" style={{ marginBottom: "12px" }}>
                Select Amenities
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                }}
              >
                <label className="checkbox-label" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={parking}
                    onChange={(e) => setParking(e.target.checked)}
                  />
                  Private Parking Space
                </label>
                <label className="checkbox-label" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={security}
                    onChange={(e) => setSecurity(e.target.checked)}
                  />
                  24/7 Security Guard
                </label>
                <label className="checkbox-label" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={balcony}
                    onChange={(e) => setBalcony(e.target.checked)}
                  />
                  Private Balcony / Terrace
                </label>
                <label className="checkbox-label" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={waterBackup}
                    onChange={(e) => setWaterBackup(e.target.checked)}
                  />
                  Water Backup Supply
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label className="form-label" style={{ marginBottom: "12px" }}>
                Gharpurja AI Insights & Badges
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <label className="checkbox-label" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isAiVerified}
                    onChange={(e) => setIsAiVerified(e.target.checked)}
                  />
                  Request AI Verification
                </label>
                <label className="checkbox-label" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isValuePick}
                    onChange={(e) => setIsValuePick(e.target.checked)}
                  />
                  Mark as Value Pick
                </label>
                <label className="checkbox-label" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isHotListing}
                    onChange={(e) => setIsHotListing(e.target.checked)}
                  />
                  Mark as Hot Listing
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Description */}
          <div>
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "16px",
                color: "#0f172a",
              }}
            >
              4. Property Description
            </h3>

            <div className="form-group">
              <label className="form-label">Detailed Description *</label>
              <textarea
                rows={6}
                placeholder="Describe key parameters, neighborhood properties, structural stability details, nearby landmarks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  outline: "none",
                  background: "#f8fafc",
                  resize: "vertical",
                }}
                className={errors.description ? "error" : ""}
              />
              {errors.description && (
                <div className="form-error-msg">{errors.description}</div>
              )}
            </div>

            {errors.submit && (
              <div className="form-error-msg" style={{ marginTop: "8px" }}>
                {errors.submit}
              </div>
            )}

            {/* Landlord Alert Note */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                marginTop: "12px",
              }}
            >
              <Info
                size={20}
                style={{ color: "#16a34a", flexShrink: 0, marginTop: "2px" }}
              />
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#15803d",
                  lineHeight: 1.5,
                }}
              >
                <strong>Landlord listing details:</strong> By posting this
                property, your profile (<strong>{user.name}</strong>,{" "}
                {user.email}) will be tagged as the primary landlord of contact.
                Ensure your settings are updated to receive customer texts.
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              margin: "12px 0 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isSubmitting ? "Posting Property..." : "Submit Listing & Post"}
          </button>
        </form>
      </div>

      {/* Success Modal Dialogue */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div
            className="modal-container"
            style={{ textAlign: "center", padding: "32px" }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle size={36} />
            </div>
            <h3
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                marginBottom: "8px",
                color: "#0f172a",
              }}
            >
              Property Posted Successfully!
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.95rem",
                lineHeight: 1.5,
                marginBottom: "24px",
              }}
            >
              Your property has been successfully listed in the Gharpurja
              database. It is now searchable on all tenant dashboards.
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <Link
                href={`/properties/${newPropertyId}`}
                style={{
                  display: "block",
                  background: "#4f46e5",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
                className="btn-modal-action"
              >
                View Posted Property Detail
              </Link>
              <Link
                href="/dashboard"
                style={{
                  display: "block",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
                className="btn-modal-action-secondary"
              >
                Go to Search Feed
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Styling tweaks */}
      <style jsx>{`
        .btn-modal-action:hover {
          background: #4338ca !important;
        }
        .btn-modal-action-secondary:hover {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}