import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useGetHeroQuery, useUpdateHeroMutation } from '../../store/api/cmsApi';
import { FiSave } from 'react-icons/fi';

const HeroPanel = () => {
  const { data: response, isLoading: isFetching } = useGetHeroQuery();
  const [updateHero, { isLoading: isUpdating }] = useUpdateHeroMutation();

  const { register, handleSubmit, reset } = useForm();

  const hero = response?.data;

  useEffect(() => {
    if (hero) {
      reset({
        headline_part1: hero.headline_part1 || '',
        headline_part2: hero.headline_part2 || '',
        subheadline: hero.subheadline || '',
        cta_primary_text: hero.cta_primary_text || '',
        cta_primary_url: hero.cta_primary_url || '',
        cta_secondary_text: hero.cta_secondary_text || '',
        cta_secondary_url: hero.cta_secondary_url || '',
        stat_rating: hero.stat_rating || '4.7',
        stat_reviews: hero.stat_reviews || '1.2k+',
        stat_years: hero.stat_years || '12yr',
      });
    }
  }, [hero, reset]);

  const onSubmit = async (values) => {
    try {
      await updateHero(values).unwrap();
      toast.success('Hero section updated successfully!');
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update hero section');
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-100 rounded-md" />
        <div className="h-44 w-full bg-slate-100 rounded-xl" />
        <div className="h-44 w-full bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 max-w-4xl">
      {/* Headlines Panel */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">Hero Headlines</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Headline - Part 1 (Regular Text)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. Savor the art of"
              {...register('headline_part1', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Headline - Part 2 (Highlighted Text)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. fine dining"
              {...register('headline_part2', { required: true })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600">Subheadline Description</label>
          <textarea
            rows={3}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            placeholder="e.g. Experience culinary excellence where every dish tells a story..."
            {...register('subheadline', { required: true })}
          />
        </div>
      </div>

      {/* Hero CTAs */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">Call to Actions (CTAs)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Primary CTA Button Text</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. Book A Table"
              {...register('cta_primary_text', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Primary CTA Redirect URL</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. /reservations or #booking"
              {...register('cta_primary_url', { required: true })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Secondary CTA Button Text (Optional)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. View Menu"
              {...register('cta_secondary_text')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Secondary CTA Redirect URL (Optional)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. /menu or #menu"
              {...register('cta_secondary_url')}
            />
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">Hero Metrics / Social Proof</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Stat: Rating (e.g. 4.9)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="4.7"
              {...register('stat_rating', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Stat: Reviews Count (e.g. 1.2k+)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="1.2k+"
              {...register('stat_reviews', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Stat: Years Experience (e.g. 10yr)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="12yr"
              {...register('stat_years', { required: true })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pr-2">
        <button
          type="submit"
          disabled={isUpdating}
          className="btn-accent flex items-center gap-2 px-6 py-3 font-semibold shadow-sm"
        >
          {isUpdating ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
          Save Hero Settings
        </button>
      </div>
    </form>
  );
};

export default HeroPanel;
