'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormError } from '@/components/ui/form-error';
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Milestone } from '@/types/project';
import { milestoneSchemas } from '@/lib/validation';

// Update the schema to include file validation
const milestoneSubmissionSchema = z.object({
  notes: z.string().max(1000, { message: 'Submission notes must not exceed 1000 characters' }),
  acceptanceCriteriaMet: z.boolean().refine(val => val === true, {
    message: 'You must confirm that all acceptance criteria have been met'
  }),
});

type MilestoneSubmissionFormData = z.infer<typeof milestoneSubmissionSchema>;

interface MilestoneSubmissionFormProps {
  milestone: Milestone;
  onSubmit: (data: MilestoneSubmissionFormData, files: File[]) => void;
}

const MilestoneSubmissionForm = ({ milestone, onSubmit }: MilestoneSubmissionFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<MilestoneSubmissionFormData>({
    resolver: zodResolver(milestoneSubmissionSchema),
    defaultValues: {
      notes: '',
      acceptanceCriteriaMet: false,
    }
  });

  const acceptanceCriteriaMet = watch('acceptanceCriteriaMet');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Validate file count
      if (files.length + newFiles.length > 5) {
        setFileError('Maximum 5 files allowed');
        return;
      }

      // Validate total size (50MB)
      const totalSize = files.reduce((acc, file) => acc + file.size, 0) +
                        newFiles.reduce((acc, file) => acc + file.size, 0);

      if (totalSize > 50 * 1024 * 1024) { // 50MB in bytes
        setFileError('Total file size cannot exceed 50MB');
        return;
      }

      // Validate individual file types
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/zip'];
      const invalidFiles = newFiles.filter(file => !validTypes.includes(file.type));

      if (invalidFiles.length > 0) {
        setFileError(`Invalid file type: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }

      setFiles(prev => [...prev, ...newFiles]);
      setFileError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = (data: MilestoneSubmissionFormData) => {
    // Validate that files exist
    if (files.length === 0) {
      setFileError('At least one file must be uploaded');
      return;
    }

    onSubmit(data, files);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Submit Milestone: {milestone.title}</CardTitle>
              <CardDescription>Submit your deliverables for client review</CardDescription>
            </div>
            <Badge
              variant={
                milestone.status === 'submitted' ? 'default' :
                milestone.status === 'revision_requested' ? 'destructive' :
                milestone.status === 'approved' ? 'secondary' :
                'outline'
              }
              className="capitalize"
            >
              {milestone.status === 'submitted' ? <CheckCircle className="mr-1 h-3 w-3" /> :
               milestone.status === 'revision_requested' ? <AlertCircle className="mr-1 h-3 w-3" /> :
               milestone.status === 'approved' ? <CheckCircle className="mr-1 h-3 w-3" /> :
               <Clock className="mr-1 h-3 w-3" />}
              {milestone.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Milestone Details */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-medium mb-2">Milestone Details</h3>
              <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
              <div className="text-sm">
                <p><span className="font-medium">Amount:</span> ${milestone.amount}</p>
                <p><span className="font-medium">Deadline:</span> {milestone.deadline || 'Not specified'}</p>
              </div>

              {milestone.acceptanceCriteria && (
                <div className="mt-3">
                  <h4 className="font-medium text-sm mb-1">Acceptance Criteria</h4>
                  <div className="text-sm text-muted-foreground bg-background p-3 rounded-md">
                    {milestone.acceptanceCriteria}
                  </div>

                  <div className="mt-3 flex items-center">
                    <input
                      type="checkbox"
                      id="acceptanceCriteriaMet"
                      className="h-4 w-4 mr-2"
                      {...register('acceptanceCriteriaMet')}
                    />
                    <Label htmlFor="acceptanceCriteriaMet" className="text-sm">
                      I confirm all acceptance criteria have been met
                    </Label>
                  </div>
                  {errors.acceptanceCriteriaMet && (
                    <FormError message={errors.acceptanceCriteriaMet.message} />
                  )}
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Deliverables</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">Max 5 files, 50MB total</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {/* File error display */}
                {fileError && (
                  <FormError message={fileError} />
                )}

                {/* Uploaded files list */}
                {files.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-2">Uploaded Files:</h4>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm truncate max-w-xs">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <AlertCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Submission Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or explanations about your deliverables..."
                rows={4}
                {...register('notes')}
              />
              {errors.notes && (
                <FormError message={errors.notes.message} />
              )}
            </div>

            {/* Confirmation and Submit */}
            <div className="space-y-4 pt-4">
              {acceptanceCriteriaMet && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-md"
                >
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <p className="text-sm text-green-700">
                      You've confirmed that all acceptance criteria have been met.
                      The client will review your submission and approve the milestone.
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSubmit(onFormSubmit)}
                  disabled={!acceptanceCriteriaMet || files.length === 0 || isUploading}
                >
                  {isUploading ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestoneSubmissionForm;