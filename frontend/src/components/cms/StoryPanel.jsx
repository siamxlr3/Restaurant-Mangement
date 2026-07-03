import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useGetStoryQuery, useUpdateStoryMutation } from '../../store/api/cmsApi';
import { FiSave } from 'react-icons/fi';

const StoryPanel = () => {
  const { data: response, isLoading: isFetching } = useGetStoryQuery();
  const [updateStory, { isLoading: isUpdating }] = useUpdateStoryMutation();

  const { register, handleSubmit, reset } = useForm();

  const story = response?.data;

  useEffect(() => {
    if (story) {
      reset({
        heading: story.heading || '',
        paragraphs_text: (story.body_paragraphs || []).join('\n\n'),
        read_more_url: story.read_more_url || '',
        stat_est_year: story.stat_est_year || '2014',
        stat_covers_night: story.stat_covers_night || '200+',
        stat_return_guests_pct: story.stat_return_guests_pct || '78%',
        stat_ranking: story.stat_ranking || '#1',
      });
    }
  }, [story, reset]);

  const onSubmit = async (values) => {
    const listParagraphs = values.paragraphs_text
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const payload = {
      heading: values.heading,
      body_paragraphs: listParagraphs,
      read_more_url: values.read_more_url,
      stat_est_year: values.stat_est_year,
      stat_covers_night: values.stat_covers_night,
      stat_return_guests_pct: values.stat_return_guests_pct,
      stat_ranking: values.stat_ranking,
    };

    try {
      await updateStory(payload).unwrap();
      toast.success('Story section updated successfully!');
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update story section');
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
      {/* Story Content */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">Our Story Content</h3>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600">Heading Title</label>
          <input
            type="text"
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="e.g. A Culinary Journey of Heritage & Heart"
            {...register('heading', { required: true })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600">Story Body Paragraphs (One per line/separated by double newlines)</label>
          <textarea
            rows={6}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-sans leading-relaxed"
            placeholder="e.g. Founded in 2014, our restaurant has served as a cornerstone of hospitality...&#10;&#10;Our ingredients are sourced fresh daily from organic local farms..."
            {...register('paragraphs_text', { required: true })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600">Read More / Details URL Link</label>
          <input
            type="text"
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="e.g. /about or #story-full"
            {...register('read_more_url')}
          />
        </div>
      </div>

      {/* Story Metrics */}
      <div className="panel p-8 flex flex-col gap-6">
        <h3 className="text-lg font-bold text-ink border-b pb-4 font-display">Story Statistics & Milestones</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Established Year (e.g. 2014)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="2014"
              {...register('stat_est_year', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600 font-sans">Covers/Night (e.g. 200+)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="200+"
              {...register('stat_covers_night', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Return Guests % (e.g. 78%)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="78%"
              {...register('stat_return_guests_pct', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Ranking Badge (e.g. #1)</label>
            <input
              type="text"
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
              placeholder="#1"
              {...register('stat_ranking', { required: true })}
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
          Save Story Settings
        </button>
      </div>
    </form>
  );
};

export default StoryPanel;
