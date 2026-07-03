import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useGetSiteConfigQuery, useUpdateSiteConfigMutation } from '../../store/api/cmsApi';
import { FiSave, FiUploadCloud } from 'react-icons/fi';

const SiteConfigPanel = () => {
  const { data: response, isLoading: isFetching } = useGetSiteConfigQuery();
  const [updateSiteConfig, { isLoading: isUpdating }] = useUpdateSiteConfigMutation();
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const siteConfig = response?.data;

  useEffect(() => {
    if (siteConfig) {
      reset({
        brand_name: siteConfig.brand_name || '',
        tagline: siteConfig.tagline || '',
        primary_color: siteConfig.primary_color || '#FF6B35',
        timezone: siteConfig.timezone || 'Asia/Dhaka',
      });
      if (siteConfig.logo_url) setLogoPreview(siteConfig.logo_url);
      if (siteConfig.favicon_url) setFaviconPreview(siteConfig.favicon_url);
    }
  }, [siteConfig, reset]);

  const onSubmit = async (values) => {
    const formData = new FormData();
    formData.append('brand_name', values.brand_name);
    formData.append('tagline', values.tagline);
    formData.append('primary_color', values.primary_color);
    formData.append('timezone', values.timezone);

    if (values.logo && values.logo[0]) {
      formData.append('logo', values.logo[0]);
    }
    if (values.favicon && values.favicon[0]) {
      formData.append('favicon', values.favicon[0]);
    }

    try {
      await updateSiteConfig(formData).unwrap();
      toast.success('Site configuration saved successfully!');
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update site configuration');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-100 rounded-md" />
        <div className="h-40 w-full bg-slate-100 rounded-xl" />
        <div className="h-40 w-full bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 max-w-4xl">
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4">General Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Brand Name</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. Banglawok"
              {...register('brand_name', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Tagline</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. Modern Bengali Cuisine"
              {...register('tagline')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Primary Branding Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-12 h-12 p-1 border border-slate-200 rounded-lg cursor-pointer"
                {...register('primary_color')}
              />
              <span className="text-sm font-mono text-slate-500 uppercase">Interactive Color Selection</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Timezone</label>
            <select
              className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
              {...register('timezone')}
            >
              <option value="Asia/Dhaka">Asia/Dhaka (+06:00)</option>
              <option value="UTC">UTC (00:00)</option>
              <option value="America/New_York">Eastern Time (-05:00)</option>
              <option value="Europe/London">London (00:00 / +01:00)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4">Assets & Media</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo Upload */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-600">Brand Logo</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-accent/40 transition-colors rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-16 object-contain rounded" />
              ) : (
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <FiUploadCloud size={24} />
                </div>
              )}
              <div className="flex flex-col items-center text-center gap-1">
                <span className="text-xs font-semibold text-accent hover:underline cursor-pointer relative">
                  Upload logo image
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    {...register('logo')}
                    onChange={handleLogoChange}
                  />
                </span>
                <span className="text-2xs text-slate-400">PNG, JPG or WebP (max 2MB)</span>
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-600">Tab Favicon</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-accent/40 transition-colors rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
              {faviconPreview ? (
                <img src={faviconPreview} alt="Favicon preview" className="w-10 h-10 object-contain rounded" />
              ) : (
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <FiUploadCloud size={24} />
                </div>
              )}
              <div className="flex flex-col items-center text-center gap-1">
                <span className="text-xs font-semibold text-accent hover:underline cursor-pointer relative">
                  Upload favicon file
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    {...register('favicon')}
                    onChange={handleFaviconChange}
                  />
                </span>
                <span className="text-2xs text-slate-400">PNG or ICO (max 2MB)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pr-2">
        <button
          type="submit"
          disabled={isUpdating}
          className="btn-accent flex items-center gap-2 px-6 py-3 font-semibold shadow-sm"
        >
          {isUpdating ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FiSave size={16} />}
          Save Site Config
        </button>
      </div>
    </form>
  );
};

export default SiteConfigPanel;
