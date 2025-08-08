import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { 
  Upload, 
  Save, 
  RotateCcw, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Building2,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BrandSettingsProps {
  onClose: () => void;
  onBrandUpdate: (brandSettings: any) => void;
}

export function BrandSettings({ onClose, onBrandUpdate }: BrandSettingsProps) {
  const [brandSettings, setBrandSettings] = useState({
    // Company Information
    companyName: 'Lineage Builders Inc.',
    tagline: 'Professional Construction Services',
    address: '16 Angela Ln, San Diego, CA 91911',
    phone: '(909) 240-7090',
    email: 'ramon.lineagebuilderinc@gmail.co',
    website: 'www.lineagebuilders.com',
    license: 'CA License #123456',
    
    // Brand Colors
    primaryColor: '#2563eb',
    secondaryColor: '#f59e0b',
    accentColor: '#10b981',
    backgroundColor: '#ffffff',
    textColor: '#1a1d23',
    
    // Typography
    fontFamily: 'Inter',
    headerFontSize: '24px',
    bodyFontSize: '14px',
    
    // Logo and Images
    logoUrl: '',
    logoPosition: 'left',
    logoSize: 'medium',
    
    // Layout Preferences
    templateStyle: 'modern',
    headerStyle: 'gradient',
    showWatermark: false,
    
    // Terms and Conditions
    defaultPaymentTerms: '10% deposit upon contract signing, 50% upon material delivery and project start, 40% upon final completion and approval.',
    defaultWarranty: 'We provide a 3-year warranty on retaining wall construction and 1-year warranty on concrete work. All materials carry manufacturer warranties.',
    defaultTimeline: 'Project duration will be determined based on scope of work, weather permitting.',
    customTerms: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Load existing brand settings
  useEffect(() => {
    loadBrandSettings();
  }, []);

  const loadBrandSettings = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/brand-settings`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.settings) {
        setBrandSettings({ ...brandSettings, ...result.settings });
        if (result.settings.logoUrl) {
          setPreviewUrl(result.settings.logoUrl);
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Logo file must be smaller than 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Update brand setting
  const updateSetting = (key: string, value: any) => {
    setBrandSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save brand settings
  const handleSave = async () => {
    setIsLoading(true);
    try {
      let logoUrl = brandSettings.logoUrl;
      
      // Upload logo if new file selected
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const uploadResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/upload-logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          logoUrl = uploadResult.logoUrl;
        } else {
          throw new Error(uploadResult.error);
        }
      }
      
      // Save brand settings
      const settingsToSave = {
        ...brandSettings,
        logoUrl
      };
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/brand-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(settingsToSave)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBrandSettings(settingsToSave);
        onBrandUpdate(settingsToSave);
        toast.success('Brand settings saved successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save brand settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setBrandSettings({
      companyName: 'Lineage Builders Inc.',
      tagline: 'Professional Construction Services',
      address: '16 Angela Ln, San Diego, CA 91911',
      phone: '(909) 240-7090',
      email: 'ramon.lineagebuilderinc@gmail.co',
      website: 'www.lineagebuilders.com',
      license: 'CA License #123456',
      primaryColor: '#2563eb',
      secondaryColor: '#f59e0b',
      accentColor: '#10b981',
      backgroundColor: '#ffffff',
      textColor: '#1a1d23',
      fontFamily: 'Inter',
      headerFontSize: '24px',
      bodyFontSize: '14px',
      logoUrl: '',
      logoPosition: 'left',
      logoSize: 'medium',
      templateStyle: 'modern',
      headerStyle: 'gradient',
      showWatermark: false,
      defaultPaymentTerms: '10% deposit upon contract signing, 50% upon material delivery and project start, 40% upon final completion and approval.',
      defaultWarranty: 'We provide a 3-year warranty on retaining wall construction and 1-year warranty on concrete work. All materials carry manufacturer warranties.',
      defaultTimeline: 'Project duration will be determined based on scope of work, weather permitting.',
      customTerms: ''
    });
    setLogoFile(null);
    setPreviewUrl('');
    toast.success('Settings reset to defaults');
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setPreviewUrl('');
    updateSetting('logoUrl', '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Brand Settings</h2>
            <p className="text-sm text-gray-600">Customize your proposal branding and design</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isLoading} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <Tabs defaultValue="company" className="p-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
            </TabsList>

            {/* Company Information */}
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={brandSettings.companyName}
                        onChange={(e) => updateSetting('companyName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={brandSettings.tagline}
                        onChange={(e) => updateSetting('tagline', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={brandSettings.address}
                      onChange={(e) => updateSetting('address', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={brandSettings.phone}
                        onChange={(e) => updateSetting('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={brandSettings.email}
                        onChange={(e) => updateSetting('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={brandSettings.website}
                        onChange={(e) => updateSetting('website', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="license">License Number</Label>
                    <Input
                      id="license"
                      value={brandSettings.license}
                      onChange={(e) => updateSetting('license', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Colors & Typography */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Color Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: 'primaryColor', label: 'Primary Color', description: 'Main brand color' },
                      { key: 'secondaryColor', label: 'Secondary Color', description: 'Accent elements' },
                      { key: 'accentColor', label: 'Accent Color', description: 'Highlights & CTAs' },
                      { key: 'backgroundColor', label: 'Background', description: 'Page background' },
                      { key: 'textColor', label: 'Text Color', description: 'Primary text' }
                    ].map((color) => (
                      <div key={color.key} className="space-y-2">
                        <Label className="text-sm font-medium">{color.label}</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={brandSettings[color.key as keyof typeof brandSettings] as string}
                            onChange={(e) => updateSetting(color.key, e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <Input
                            value={brandSettings[color.key as keyof typeof brandSettings] as string}
                            onChange={(e) => updateSetting(color.key, e.target.value)}
                            className="flex-1"
                            placeholder="#000000"
                          />
                        </div>
                        <p className="text-xs text-gray-500">{color.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Typography
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <select
                        id="fontFamily"
                        value={brandSettings.fontFamily}
                        onChange={(e) => updateSetting('fontFamily', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="headerFontSize">Header Font Size</Label>
                      <Input
                        id="headerFontSize"
                        value={brandSettings.headerFontSize}
                        onChange={(e) => updateSetting('headerFontSize', e.target.value)}
                        placeholder="24px"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bodyFontSize">Body Font Size</Label>
                      <Input
                        id="bodyFontSize"
                        value={brandSettings.bodyFontSize}
                        onChange={(e) => updateSetting('bodyFontSize', e.target.value)}
                        placeholder="14px"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logo Settings */}
            <TabsContent value="logo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Company Logo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="logo">Upload Logo</Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            id="logo"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="logo"
                            className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                          >
                            {previewUrl ? (
                              <div className="relative">
                                <ImageWithFallback
                                  src={previewUrl}
                                  alt="Logo preview"
                                  className="max-h-24 max-w-32 object-contain"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveLogo();
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Click to upload logo</p>
                                <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logoPosition">Logo Position</Label>
                      <select
                        id="logoPosition"
                        value={brandSettings.logoPosition}
                        onChange={(e) => updateSetting('logoPosition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="logoSize">Logo Size</Label>
                      <select
                        id="logoSize"
                        value={brandSettings.logoSize}
                        onChange={(e) => updateSetting('logoSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Settings */}
            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'modern', label: 'Modern', description: 'Clean, minimalist design' },
                      { value: 'professional', label: 'Professional', description: 'Traditional business style' },
                      { value: 'creative', label: 'Creative', description: 'Bold, eye-catching design' }
                    ].map((style) => (
                      <div
                        key={style.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          brandSettings.templateStyle === style.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => updateSetting('templateStyle', style.value)}
                      >
                        <h4 className="font-medium">{style.label}</h4>
                        <p className="text-sm text-gray-600">{style.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Header Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { value: 'gradient', label: 'Gradient', description: 'Colorful gradient header' },
                      { value: 'solid', label: 'Solid Color', description: 'Single color header' },
                      { value: 'minimal', label: 'Minimal', description: 'Simple white header' },
                      { value: 'image', label: 'Background Image', description: 'Custom image background' }
                    ].map((style) => (
                      <div
                        key={style.value}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          brandSettings.headerStyle === style.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => updateSetting('headerStyle', style.value)}
                      >
                        <h5 className="font-medium text-sm">{style.label}</h5>
                        <p className="text-xs text-gray-600">{style.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Terms & Conditions */}
            <TabsContent value="terms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Default Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Textarea
                      id="paymentTerms"
                      value={brandSettings.defaultPaymentTerms}
                      onChange={(e) => updateSetting('defaultPaymentTerms', e.target.value)}
                      rows={3}
                      placeholder="Enter default payment terms..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="warranty">Warranty Information</Label>
                    <Textarea
                      id="warranty"
                      value={brandSettings.defaultWarranty}
                      onChange={(e) => updateSetting('defaultWarranty', e.target.value)}
                      rows={3}
                      placeholder="Enter warranty information..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="timeline">Timeline Information</Label>
                    <Textarea
                      id="timeline"
                      value={brandSettings.defaultTimeline}
                      onChange={(e) => updateSetting('defaultTimeline', e.target.value)}
                      rows={2}
                      placeholder="Enter timeline information..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="customTerms">Additional Terms</Label>
                    <Textarea
                      id="customTerms"
                      value={brandSettings.customTerms}
                      onChange={(e) => updateSetting('customTerms', e.target.value)}
                      rows={4}
                      placeholder="Enter any additional terms and conditions..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}