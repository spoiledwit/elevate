'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ThumbnailPreviewer } from './ThumbnailPreviewer'
import { CheckoutPreviewer } from './CheckoutPreviewer'
import { TinyMCEEditor } from '@/components/TinyMCEEditor'
import { createNewProductAction, updateCustomLinkWithFileAction, updateCustomLinkAction, type NewProductCreateData } from '@/actions'
import { uploadDocumentAction } from '@/actions/upload-action'
import digitalProductImg from '@/assets/product-types/digitalProduct.svg'
import customProductImg from '@/assets/product-types/product.svg'
import eCourseImg from '@/assets/product-types/eCourse.svg'
import urlMediaImg from '@/assets/product-types/media.svg'
import uploadImg from '@/assets/imgs/upload.png'
import {
  Plus,
  FileText,
  Package,
  GraduationCap,
  Link,
  ArrowRight,
  Image as ImageIcon,
  X,
  DollarSign,
  Tag,
  ShoppingCart,
  Download,
  BookOpen,
  Clock,
  ExternalLink,
  PlusCircle,
  User,
  Mail,
  Trash2,
  Type,
  Hash,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Phone,
  Globe,
  Settings
} from 'lucide-react'

interface LinkFormProps {
  link?: any
  onClose?: () => void
}

type ProductType = 'digital' | 'custom' | 'ecourse' | 'url-media' | null

export function LinkForm({ link, onClose }: LinkFormProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<ProductType>(null)
  const [selectedStyle, setSelectedStyle] = useState<'button' | 'callout' | null>('callout')
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Thumbnail state
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Checkout state
  const [checkoutImage, setCheckoutImage] = useState<File | null>(null)
  const [checkoutImagePreview, setCheckoutImagePreview] = useState<string>('')
  const [checkoutTitle, setCheckoutTitle] = useState('')
  const [checkoutDescription, setCheckoutDescription] = useState('')
  const [checkoutBottomTitle, setCheckoutBottomTitle] = useState('')
  const [checkoutCtaButtonText, setCheckoutCtaButtonText] = useState('Buy Now')
  const [checkoutPrice, setCheckoutPrice] = useState('')
  const [checkoutDiscountedPrice, setCheckoutDiscountedPrice] = useState('')
  const checkoutFileInputRef = useRef<HTMLInputElement>(null)

  // Product-specific state
  const [digitalFileUrl, setDigitalFileUrl] = useState('')
  const [downloadInstructions, setDownloadInstructions] = useState('')
  const [digitalFile, setDigitalFile] = useState<File | null>(null)
  const [digitalFileName, setDigitalFileName] = useState<string>('')
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const digitalFileInputRef = useRef<HTMLInputElement>(null)
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([])
  const [courseModules, setCourseModules] = useState<string[]>([''])
  const [courseDuration, setCourseDuration] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [buttonText, setButtonText] = useState('View Content')

  // Collect info fields state - prefilled with name and email
  const [collectInfoFields, setCollectInfoFields] = useState<{
    field_type: string;
    label: string;
    placeholder?: string;
    is_required: boolean;
    options?: string[];
    order: number;
  }[]>([
    {
      field_type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      is_required: true,
      order: 1
    },
    {
      field_type: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email address',
      is_required: true,
      order: 2
    }
  ])
  const [collectInfoErrors, setCollectInfoErrors] = useState<Record<number, string>>({})
  // Store raw options text for each field to allow proper editing
  const [optionsText, setOptionsText] = useState<Record<number, string>>({})
  const [showFieldTypeDropdown, setShowFieldTypeDropdown] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const productTypes = [
    {
      id: 'digital' as const,
      title: 'Digital Product',
      description: 'Sell digital downloads like PDFs, images, audio files, or software',
      icon: FileText,
      color: 'bg-blue-50 border-blue-200 text-blue-600',
      image: digitalProductImg
    },
    {
      id: 'custom' as const,
      title: 'Custom Product',
      description: 'Create a custom product with your own fields and pricing',
      icon: Package,
      color: 'bg-purple-50 border-purple-200 text-brand-600',
      image: customProductImg
    },
    {
      id: 'ecourse' as const,
      title: 'eCourse',
      description: 'Create and sell online courses with lessons and content',
      icon: GraduationCap,
      color: 'bg-green-50 border-green-200 text-green-600',
      image: eCourseImg
    },
    {
      id: 'url-media' as const,
      title: 'URL/Media',
      description: 'Simple link to external content or media files',
      icon: Link,
      color: 'bg-orange-50 border-orange-200 text-orange-600',
      image: urlMediaImg
    }
  ]

  // Populate form data when editing existing product
  useEffect(() => {
    if (link) {
      setIsEditMode(true)

      // Map product type from backend format to frontend format
      const getProductTypeFromBackend = (backendType: string): ProductType => {
        switch (backendType) {
          case 'digital_product': return 'digital'
          case 'custom_product': return 'custom'
          case 'ecourse': return 'ecourse'
          case 'url_media': return 'url-media'
          default: return 'digital'
        }
      }

      // Set basic product info
      const productType = getProductTypeFromBackend(link.type || 'digital_product')
      setSelectedType(productType)
      setStep(2) // Skip product type selection step

      // Set basic information
      setTitle(link.title || '')
      setSubtitle(link.subtitle || '')
      setSelectedStyle(link.style || 'callout')

      // Set thumbnail
      if (link.thumbnail) {
        setThumbnailPreview(link.thumbnail)
      }

      // Set pricing
      setCheckoutPrice(link.checkout_price?.toString() || '')
      setCheckoutDiscountedPrice(link.checkout_discounted_price?.toString() || '')

      // Set checkout information
      setCheckoutTitle(link.checkout_title || '')
      setCheckoutDescription(link.checkout_description || '')
      setCheckoutBottomTitle(link.checkout_bottom_title || '')
      setCheckoutCtaButtonText(link.checkout_cta_button_text || 'Buy Now')

      // Set checkout image
      if (link.checkout_image) {
        setCheckoutImagePreview(link.checkout_image)
      }

      // Set product-specific data from additional_info
      if (link.additional_info) {
        const additionalInfo = link.additional_info

        if (productType === 'digital') {
          setDigitalFileUrl(additionalInfo.digital_file_url || '')
          setDownloadInstructions(additionalInfo.download_instructions || '')
        } else if (productType === 'custom') {
          setCustomFields(additionalInfo.custom_fields || [])
        } else if (productType === 'ecourse') {
          setCourseDuration(additionalInfo.course_duration || '')
          setCourseModules(additionalInfo.course_modules || [''])
        } else if (productType === 'url-media') {
          setMediaUrl(additionalInfo.destination_url || '')
          setButtonText(additionalInfo.button_text || 'View Content')
        }
      }

      // Set collect info fields
      if (link.collect_info_fields && link.collect_info_fields.length > 0) {
        setCollectInfoFields(link.collect_info_fields)
      }
    }
  }, [link])

  const handleTypeSelect = async (type: ProductType) => {
    setSelectedType(type)

    // Auto-set fields for digital product
    if (type === 'digital') {
      // Step 2: Basic info
      setThumbnailPreview(digitalProductImg.src)

      // Convert SVG to File object for thumbnail
      try {
        const response = await fetch(digitalProductImg.src)
        const blob = await response.blob()
        const file = new File([blob], 'digital-product-thumbnail.svg', { type: 'image/svg+xml' })
        setThumbnail(file)
      } catch (error) {
        console.error('Failed to convert thumbnail to file:', error)
      }

      setTitle('Download Your Digital Product Today!')
      setSubtitle('Instant access to premium content that will transform your journey')
      setCheckoutPrice('49.99')
      setCheckoutDiscountedPrice('29.99')

      // Step 3: Checkout details
      setCheckoutTitle('Get Instant Access to Your Digital Product')
      setCheckoutDescription('<h3>What You\'ll Get:</h3><ul><li>✅ Immediate download after purchase</li><li>✅ Lifetime access to all updates</li><li>✅ Professional quality content</li><li>✅ 30-day money-back guarantee</li></ul><p>Transform your skills with our premium digital content. Join thousands of satisfied customers who have already upgraded their journey!</p>')
      setCheckoutBottomTitle('Ready to Get Started?')
      setCheckoutCtaButtonText('Get Instant Access Now')

      // Also set checkout image to the same
      setCheckoutImagePreview(digitalProductImg.src)
      try {
        const response = await fetch(digitalProductImg.src)
        const blob = await response.blob()
        const file = new File([blob], 'digital-product-checkout.svg', { type: 'image/svg+xml' })
        setCheckoutImage(file)
      } catch (error) {
        console.error('Failed to convert checkout image to file:', error)
      }
    }

    // Auto-set fields for custom product
    if (type === 'custom') {
      // Step 2: Basic info
      setThumbnailPreview(customProductImg.src)

      // Convert SVG to File object for thumbnail
      try {
        const response = await fetch(customProductImg.src)
        const blob = await response.blob()
        const file = new File([blob], 'custom-product-thumbnail.svg', { type: 'image/svg+xml' })
        setThumbnail(file)
      } catch (error) {
        console.error('Failed to convert thumbnail to file:', error)
      }

      setTitle('Get Your Custom Product Today!')
      setSubtitle('Premium quality product tailored just for you')
      setCheckoutPrice('99.99')
      setCheckoutDiscountedPrice('79.99')

      // Step 3: Checkout details
      setCheckoutTitle('Order Your Custom Product')
      setCheckoutDescription('<h3>What Makes This Special:</h3><ul><li>✅ Completely customized to your needs</li><li>✅ Premium materials and craftsmanship</li><li>✅ Personal consultation included</li><li>✅ Satisfaction guaranteed</li></ul><p>Experience the difference of a product made specifically for you. Join our community of satisfied customers who chose quality and personalization!</p>')
      setCheckoutBottomTitle('Ready to Order?')
      setCheckoutCtaButtonText('Order Custom Product')

      // Also set checkout image to the same
      setCheckoutImagePreview(customProductImg.src)
      try {
        const response = await fetch(customProductImg.src)
        const blob = await response.blob()
        const file = new File([blob], 'custom-product-checkout.svg', { type: 'image/svg+xml' })
        setCheckoutImage(file)
      } catch (error) {
        console.error('Failed to convert checkout image to file:', error)
      }
    }

    // Auto-set fields for URL/Media
    if (type === 'url-media') {
      // Step 2: Basic info
      setThumbnailPreview(urlMediaImg.src)

      // Convert SVG to File object for thumbnail
      try {
        const response = await fetch(urlMediaImg.src)
        const blob = await response.blob()
        const file = new File([blob], 'url-media-thumbnail.svg', { type: 'image/svg+xml' })
        setThumbnail(file)
      } catch (error) {
        console.error('Failed to convert thumbnail to file:', error)
      }

      setTitle('Access Premium Content')
      setSubtitle('Exclusive media and resources for your success')
      setCheckoutPrice('19.99')
      setCheckoutDiscountedPrice('14.99')

      // Step 3: Checkout details
      setCheckoutTitle('Get Access to Premium Media')
      setCheckoutDescription('<h3>Exclusive Access Includes:</h3><ul><li>✅ High-quality media content</li><li>✅ Instant online access</li><li>✅ Compatible with all devices</li><li>✅ Regular content updates</li></ul><p>Unlock premium content that will elevate your knowledge and skills. Join our community and start your journey today!</p>')
      setCheckoutBottomTitle('Ready to Access?')
      setCheckoutCtaButtonText('Get Access Now')

      // Set default media URL
      setMediaUrl('https://example.com/your-premium-content')
      setButtonText('Access Content')

      // Also set checkout image to the same
      setCheckoutImagePreview(urlMediaImg.src)
      try {
        const response = await fetch(urlMediaImg.src)
        const blob = await response.blob()
        const file = new File([blob], 'url-media-checkout.svg', { type: 'image/svg+xml' })
        setCheckoutImage(file)
      } catch (error) {
        console.error('Failed to convert checkout image to file:', error)
      }
    }

    // Auto-set fields for eCourse
    if (type === 'ecourse') {
      // Step 2: Basic info
      setThumbnailPreview(eCourseImg.src)

      // Convert SVG to File object for thumbnail
      try {
        const response = await fetch(eCourseImg.src)
        const blob = await response.blob()
        const file = new File([blob], 'ecourse-thumbnail.svg', { type: 'image/svg+xml' })
        setThumbnail(file)
      } catch (error) {
        console.error('Failed to convert thumbnail to file:', error)
      }

      setTitle('Master New Skills with Our eCourse')
      setSubtitle('Comprehensive online course with expert guidance')
      setCheckoutPrice('199.99')
      setCheckoutDiscountedPrice('149.99')

      // Step 3: Checkout details
      setCheckoutTitle('Enroll in Our Premium eCourse')
      setCheckoutDescription('<h3>What You\'ll Learn:</h3><ul><li>✅ Step-by-step video lessons</li><li>✅ Downloadable resources and worksheets</li><li>✅ Interactive assignments and quizzes</li><li>✅ Certificate of completion</li><li>✅ Lifetime access to course materials</li><li>✅ Direct access to instructor support</li></ul><p>Transform your skills with our comprehensive online course. Join thousands of successful students who have already mastered these valuable skills!</p>')
      setCheckoutBottomTitle('Ready to Start Learning?')
      setCheckoutCtaButtonText('Enroll Now')

      // Set default course info
      setCourseDuration('8 weeks • Self-paced')
      setCourseModules([
        'Introduction and Course Overview',
        'Fundamentals and Basic Concepts',
        'Advanced Techniques and Strategies',
        'Practical Applications and Case Studies',
        'Final Project and Certification'
      ])

      // Also set checkout image to the same
      setCheckoutImagePreview(eCourseImg.src)
      try {
        const response = await fetch(eCourseImg.src)
        const blob = await response.blob()
        const file = new File([blob], 'ecourse-checkout.svg', { type: 'image/svg+xml' })
        setCheckoutImage(file)
      } catch (error) {
        console.error('Failed to convert checkout image to file:', error)
      }
    }

    setStep(2) // Immediately go to next step
  }

  const handleContinue = () => {
    if (step === 1 && selectedType) {
      setStep(2)
    } else if (step === 2 && title.trim() && selectedStyle && checkoutPrice) {
      setStep(3)
    } else if (step === 3) {
      // Always go to collect info step (step 4)
      setStep(4)
    } else if (step === 4) {
      // Validate collect info fields before continuing
      if (validateCollectInfoFields()) {
        setStep(5)
      } else {
        toast.error('Please fix the errors in your information fields')
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      if (onClose) {
        onClose()
      } else {
        router.push('/custom-links')
      }
    }
  }

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }

      setThumbnail(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeThumbnail = () => {
    setThumbnail(null)
    setThumbnailPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCheckoutImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }

      setCheckoutImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCheckoutImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCheckoutImage = () => {
    setCheckoutImage(null)
    setCheckoutImagePreview('')
    if (checkoutFileInputRef.current) {
      checkoutFileInputRef.current.value = ''
    }
  }

  // Collect info field helpers
  const addCollectInfoField = () => {
    setCollectInfoFields([
      ...collectInfoFields,
      {
        field_type: 'text',
        label: '',
        placeholder: '',
        is_required: false,
        order: collectInfoFields.length + 1
      }
    ])
  }

  const addCollectInfoFieldWithType = (fieldType: string) => {
    const fieldTypeOption = fieldTypeOptions.find(opt => opt.value === fieldType)
    setCollectInfoFields([
      ...collectInfoFields,
      {
        field_type: fieldType,
        label: fieldTypeOption?.label.replace(/\s*Field$/, '') || '',
        placeholder: '',
        is_required: false,
        options: ['select', 'checkbox', 'radio'].includes(fieldType) ? ['Option 1'] : undefined,
        order: collectInfoFields.length + 1
      }
    ])
  }

  const removeCollectInfoField = (index: number) => {
    // Prevent deletion of the first two fields (name and email)
    if (index < 2) {
      return
    }

    setCollectInfoFields(collectInfoFields.filter((_, i) => i !== index))
    // Clean up options text state
    setOptionsText(prev => {
      const updated = { ...prev }
      delete updated[index]
      // Re-index remaining entries
      const newOptionsText: Record<number, string> = {}
      Object.entries(updated).forEach(([key, value]) => {
        const oldIndex = parseInt(key)
        if (oldIndex > index) {
          newOptionsText[oldIndex - 1] = value
        } else {
          newOptionsText[oldIndex] = value
        }
      })
      return newOptionsText
    })
  }

  const updateCollectInfoField = (index: number, field: Partial<typeof collectInfoFields[0]>) => {
    const updated = [...collectInfoFields]
    updated[index] = { ...updated[index], ...field }
    setCollectInfoFields(updated)

    // Clear error for this field when it's updated
    if (collectInfoErrors[index]) {
      const newErrors = { ...collectInfoErrors }
      delete newErrors[index]
      setCollectInfoErrors(newErrors)
    }
  }

  const fieldTypeOptions = [
    { value: 'text', label: 'Text Input', icon: Type },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'textarea', label: 'Long Text', icon: AlignLeft },
    { value: 'select', label: 'Dropdown', icon: List },
    { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
    { value: 'radio', label: 'Radio Buttons', icon: Circle },
    { value: 'tel', label: 'Phone', icon: Phone },
    { value: 'url', label: 'Website URL', icon: Globe }
  ]

  // Validate collect info fields
  const validateCollectInfoFields = () => {
    const errors: Record<number, string> = {}

    collectInfoFields.forEach((field, index) => {
      // Validate label
      if (!field.label.trim()) {
        errors[index] = 'Field label is required'
        return
      }

      // Validate options for select/checkbox/radio fields
      if (['select', 'checkbox', 'radio'].includes(field.field_type)) {
        if (!field.options || field.options.length === 0) {
          errors[index] = `Options are required for ${fieldTypeOptions.find(opt => opt.value === field.field_type)?.label} fields`
          return
        }

        // Check for empty options
        if (field.options.some(option => !option.trim())) {
          errors[index] = 'All options must have values (no empty options)'
          return
        }
      }
    })

    setCollectInfoErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdateProduct = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Handle file upload for digital products if a new file is selected
      let finalDigitalFileUrl = digitalFileUrl

      if (selectedType === 'digital' && digitalFile) {
        setIsUploadingFile(true)

        const uploadResult = await uploadDocumentAction(digitalFile, 'digital-products')

        if (uploadResult.error) {
          toast.error(`Failed to upload file: ${uploadResult.error}`)
          setIsSubmitting(false)
          setIsUploadingFile(false)
          return
        }

        if (uploadResult.data) {
          finalDigitalFileUrl = uploadResult.data.secure_url
        }

        setIsUploadingFile(false)
      }

      // Map product type to backend format
      const getProductTypeKey = (type: ProductType): string => {
        switch (type) {
          case 'digital': return 'digital_product'
          case 'custom': return 'custom_product'
          case 'ecourse': return 'ecourse'
          case 'url-media': return 'url_media'
          default: return 'generic'
        }
      }

      // Prepare additional info based on product type
      let additionalInfo: any = {}

      if (selectedType === 'digital') {
        additionalInfo = {
          digital_file_url: finalDigitalFileUrl,
          download_instructions: downloadInstructions
        }
      } else if (selectedType === 'custom') {
        additionalInfo = {
          custom_fields: customFields.filter(field => field.label.trim() && field.value.trim())
        }
      } else if (selectedType === 'ecourse') {
        additionalInfo = {
          course_duration: courseDuration,
          course_modules: courseModules.filter(module => module.trim())
        }
      } else if (selectedType === 'url-media') {
        additionalInfo = {
          destination_url: mediaUrl,
          button_text: buttonText
        }
      }

      // Check if we need to use FormData for file uploads
      const hasFileUploads = thumbnail instanceof File || checkoutImage instanceof File

      if (hasFileUploads) {
        // Use FormData for file uploads
        const formData = new FormData()

        // Basic data
        formData.append('type', getProductTypeKey(selectedType))
        formData.append('title', title.trim())
        formData.append('subtitle', subtitle.trim() || '')
        formData.append('style', selectedStyle || 'callout')
        formData.append('checkout_title', checkoutTitle.trim() || '')
        formData.append('checkout_description', checkoutDescription.trim() || '')
        formData.append('checkout_bottom_title', checkoutBottomTitle.trim() || '')
        formData.append('checkout_cta_button_text', checkoutCtaButtonText)
        formData.append('checkout_price', checkoutPrice || '')
        formData.append('checkout_discounted_price', checkoutDiscountedPrice || '')
        formData.append('additional_info', JSON.stringify(additionalInfo))
        formData.append('collect_info_fields_data', JSON.stringify(collectInfoFields))
        formData.append('is_active', 'true')

        // Add files if they exist
        if (thumbnail instanceof File) {
          formData.append('thumbnail', thumbnail)
        }
        if (checkoutImage instanceof File) {
          formData.append('checkout_image', checkoutImage)
        }

        const result = await updateCustomLinkWithFileAction(link.id.toString(), formData)

        if (result.error) {
          toast.error(`Failed to update product: ${result.error}`)
        } else {
          toast.success('Product updated successfully!')
          if (onClose) {
            onClose()
          } else {
            router.push('/custom-links')
          }
        }
      } else {
        // Use regular JSON update
        const updateData = {
          type: getProductTypeKey(selectedType),
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          style: selectedStyle || undefined,
          checkout_title: checkoutTitle.trim() || undefined,
          checkout_description: checkoutDescription.trim() || undefined,
          checkout_bottom_title: checkoutBottomTitle.trim() || undefined,
          checkout_cta_button_text: checkoutCtaButtonText,
          checkout_price: checkoutPrice || undefined,
          checkout_discounted_price: checkoutDiscountedPrice || undefined,
          additional_info: Object.keys(additionalInfo).length > 0 ? additionalInfo : undefined,
          collect_info_fields_data: collectInfoFields.length > 0 ? collectInfoFields : undefined,
          is_active: true
        }

        const result = await updateCustomLinkAction(link.id.toString(), updateData)

        if ('error' in result) {
          toast.error(`Failed to update product: ${result.error}`)
        } else {
          toast.success('Product updated successfully!')
          if (onClose) {
            onClose()
          } else {
            router.push('/custom-links')
          }
        }
      }

    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateProduct = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Handle file upload for digital products if a file is selected
      let finalDigitalFileUrl = digitalFileUrl

      if (selectedType === 'digital' && digitalFile) {
        setIsUploadingFile(true)

        const uploadResult = await uploadDocumentAction(digitalFile, 'digital-products')

        if (uploadResult.error) {
          toast.error(`Failed to upload file: ${uploadResult.error}`)
          setIsSubmitting(false)
          setIsUploadingFile(false)
          return
        }

        if (uploadResult.data) {
          finalDigitalFileUrl = uploadResult.data.secure_url
        }

        setIsUploadingFile(false)
      }

      // Map product type to backend format
      const getProductTypeKey = (type: ProductType): string => {
        switch (type) {
          case 'digital': return 'digital_product'
          case 'custom': return 'custom_product'
          case 'ecourse': return 'ecourse'
          case 'url-media': return 'url_media'
          default: return 'generic'
        }
      }

      // Prepare additional info based on product type
      let additionalInfo: any = {}

      if (selectedType === 'digital') {
        additionalInfo = {
          digital_file_url: finalDigitalFileUrl,
          download_instructions: downloadInstructions
        }
      } else if (selectedType === 'custom') {
        additionalInfo = {
          custom_fields: customFields.filter(field => field.label.trim() && field.value.trim())
        }
      } else if (selectedType === 'ecourse') {
        additionalInfo = {
          course_duration: courseDuration,
          course_modules: courseModules.filter(module => module.trim())
        }
      } else if (selectedType === 'url-media') {
        additionalInfo = {
          destination_url: mediaUrl,
          button_text: buttonText
        }
      }

      // Prepare product data
      const productData: NewProductCreateData = {
        type: getProductTypeKey(selectedType),
        thumbnail: thumbnail,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        button_text: checkoutCtaButtonText,
        style: selectedStyle || undefined,
        checkout_image: checkoutImage,
        checkout_title: checkoutTitle.trim() || undefined,
        checkout_description: checkoutDescription.trim() || undefined,
        checkout_bottom_title: checkoutBottomTitle.trim() || undefined,
        checkout_cta_button_text: checkoutCtaButtonText,
        checkout_price: checkoutPrice || undefined,
        checkout_discounted_price: checkoutDiscountedPrice || undefined,
        additional_info: Object.keys(additionalInfo).length > 0 ? additionalInfo : undefined,
        collect_info_fields_data: collectInfoFields.length > 0 ? collectInfoFields : undefined,
        is_active: true,
        order: 0
      }

      // Create the product
      const result = await createNewProductAction(productData)

      if (result.error) {
        toast.error(`Failed to create product: ${result.error}`)
      } else {
        toast.success('Product created successfully!')
        router.push('/custom-links')
      }

    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`w-full ${step >= 2 ? 'bg-white px-6' : ''}`}>
      {/* Header */}
      <div className="py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {link ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-sm text-gray-600">
              Step {step} of 5: {
                step === 1 ? 'Choose your product type' :
                  step === 2 ? 'Add basic information' :
                    step === 3 ? 'Configure checkout & pricing' :
                      step === 4 ? 'Information to collect' :
                        'Product-specific details'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Product Type Selection - Skip in edit mode */}
      {step === 1 && !isEditMode && (
        <div className="pt-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {productTypes.map((type) => {
              const isSelected = selectedType === type.id

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeSelect(type.id)}
                  className="p-2 rounded-2xl text-left transition-all duration-200 bg-white hover:shadow-md"
                  style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon Section */}
                    <div className={`
                      w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0
                      ${type.color.split(' ')[0]}
                    `}>
                      <img
                        src={type.image.src}
                        alt={type.title}
                        className="w-24 h-24 object-contain"
                      />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1 text-gray-900">
                        {type.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

        </div>
      )}

      {/* Step 2: Product Details */}
      {step === 2 && (
        <div className="p-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="space-y-6">
              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Product Thumbnail
                </label>

                {thumbnailPreview ? (
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Thumbnail uploaded</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove thumbnail"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Click to upload thumbnail
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
              </div>

              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Product Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a catchy title for your product"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {title.length}/100 characters
                </p>
              </div>

              {/* Subtitle Field */}
              <div>
                <label htmlFor="subtitle" className="block text-sm font-semibold text-gray-900 mb-2">
                  Product Subtitle <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Brief description or tagline"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                  maxLength={150}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {subtitle.length}/150 characters
                </p>
              </div>


              {/* Style Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Display Style
                </label>
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  {/* Button Style */}
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('button')}
                    className={`
                      p-4 rounded-2xl text-center transition-all duration-200 bg-white hover:shadow-md border-2
                      ${selectedStyle === 'button'
                        ? 'bg-gray-100 border-gray-300'
                        : 'border-transparent'
                      }
                    `}
                    style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-4 rounded border-2 border-gray-800"></div>
                      </div>
                      {/* Label */}
                      <span className="text-lg font-semibold text-gray-900">Button</span>
                    </div>
                  </button>

                  {/* Callout Style */}
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('callout')}
                    className={`
                      p-4 rounded-2xl text-center transition-all duration-200 bg-white hover:shadow-md border-2
                      ${selectedStyle === 'callout'
                        ? 'bg-gray-100 border-gray-300'
                        : 'border-transparent'
                      }
                    `}
                    style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-5 rounded border-2 border-gray-800 relative">
                          <div className="absolute top-1 left-1 w-4 h-0.5 bg-gray-600 rounded-full"></div>
                          <div className="absolute top-2 left-1 w-3 h-0.5 bg-gray-600 rounded-full"></div>
                        </div>
                      </div>
                      {/* Label */}
                      <span className="text-lg font-semibold text-gray-900">Callout</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pricing Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Pricing
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regular Price */}
                  <div>
                    <label htmlFor="checkout-price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        id="checkout-price"
                        value={checkoutPrice}
                        onChange={(e) => setCheckoutPrice(e.target.value)}
                        placeholder="99.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Discounted Price */}
                  <div>
                    <label htmlFor="checkout-discounted-price" className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Price <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        id="checkout-discounted-price"
                        value={checkoutDiscountedPrice}
                        onChange={(e) => setCheckoutDiscountedPrice(e.target.value)}
                        placeholder="79.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                      />
                    </div>
                    {checkoutDiscountedPrice && checkoutPrice && parseFloat(checkoutDiscountedPrice) >= parseFloat(checkoutPrice) && (
                      <p className="mt-1 text-xs text-red-600">Sale price should be less than regular price</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Column */}
            <div className="lg:sticky lg:top-6">
              <ThumbnailPreviewer
                productType={selectedType}
                thumbnail={thumbnailPreview}
                title={title}
                subtitle={subtitle}
                displayStyle={selectedStyle}
                buttonText="View"
                price={checkoutPrice || "0.00"}
                discountedPrice={checkoutDiscountedPrice}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            {!(isEditMode && step === 2) && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleContinue}
              disabled={!title.trim() || !selectedStyle || !checkoutPrice}
              className={`${!(isEditMode && step === 2) ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium`}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Checkout & Pricing */}
      {step === 3 && (
        <div className="p-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="space-y-6">
              {/* Checkout Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Checkout Page Image <span className="text-gray-400 font-normal">(Optional)</span>
                </label>

                {checkoutImagePreview ? (
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={checkoutImagePreview}
                        alt="Checkout image preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Checkout image uploaded</p>
                      <p className="text-xs text-gray-600">
                        This image will be displayed on the checkout page
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCheckoutImage}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove checkout image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => checkoutFileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Add checkout page image
                    </p>
                  </div>
                )}

                <input
                  ref={checkoutFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCheckoutImageSelect}
                  className="hidden"
                />
              </div>

              {/* Checkout Title */}
              <div>
                <label htmlFor="checkout-title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Checkout Page Title
                </label>
                <input
                  type="text"
                  id="checkout-title"
                  value={checkoutTitle}
                  onChange={(e) => setCheckoutTitle(e.target.value)}
                  placeholder="e.g., Premium Course Bundle"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {checkoutTitle.length}/100 characters
                </p>
              </div>

              {/* Checkout Description */}
              <div>
                <label htmlFor="checkout-description" className="block text-sm font-semibold text-gray-900 mb-2">
                  Product Description
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <TinyMCEEditor
                    value={checkoutDescription}
                    onChange={setCheckoutDescription}
                    height={300}
                  />
                </div>
              </div>


              {/* Bottom Title & CTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bottom Title */}
                <div>
                  <label htmlFor="checkout-bottom-title" className="block text-sm font-semibold text-gray-900 mb-2">
                    Bottom Section Title <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="checkout-bottom-title"
                    value={checkoutBottomTitle}
                    onChange={(e) => setCheckoutBottomTitle(e.target.value)}
                    placeholder="e.g., What's included?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                    maxLength={100}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {checkoutBottomTitle.length}/100 characters
                  </p>
                </div>

                {/* CTA Button Text */}
                <div>
                  <label htmlFor="checkout-cta-button" className="block text-sm font-semibold text-gray-900 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    id="checkout-cta-button"
                    value={checkoutCtaButtonText}
                    onChange={(e) => setCheckoutCtaButtonText(e.target.value)}
                    placeholder="Buy Now"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                    maxLength={50}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {checkoutCtaButtonText.length}/50 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Column */}
            <div className="lg:sticky lg:top-6">
              <CheckoutPreviewer
                productType={selectedType}
                thumbnail={checkoutImagePreview || thumbnailPreview}
                title={title}
                subtitle={subtitle}
                checkoutTitle={checkoutTitle}
                checkoutDescription={checkoutDescription}
                checkoutBottomTitle={checkoutBottomTitle}
                checkoutCtaButtonText={checkoutCtaButtonText}
                price={checkoutPrice || "0.00"}
                discountedPrice={checkoutDiscountedPrice}
                customFields={customFields}
                collectInfoFields={collectInfoFields}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={false}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Collect Info Fields Configuration */}
      {step === 4 && (
        <div className="p-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="space-y-6">
              {/* Fields Section */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900">Fields</h4>
                <p className="text-sm text-gray-600">Basic info fields can't be edited</p>

                {/* Fixed Name and Email Fields */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="flex-1 text-gray-900">Name</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="flex-1 text-gray-900">Email</span>
                  </div>
                </div>

                {/* Custom Fields */}
                {collectInfoFields.length > 2 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Collect additional customer info</p>
                    {collectInfoFields.slice(2).map((field, index) => {
                      const actualIndex = index + 2
                      const fieldIcon = fieldTypeOptions.find(opt => opt.value === field.field_type)?.icon

                      return (
                        <div key={actualIndex} className="bg-gray-50 rounded-lg p-4">
                          {/* Field Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4 flex-1">
                              {fieldIcon && React.createElement(fieldIcon, { className: 'w-5 h-5 text-gray-600' })}
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateCollectInfoField(actualIndex, { label: e.target.value })}
                                className="flex-1 bg-transparent border-none text-gray-900 font-medium focus:outline-none"
                                placeholder="Field title..."
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">Required</span>
                              <button
                                type="button"
                                onClick={() => updateCollectInfoField(actualIndex, { is_required: !field.is_required })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${field.is_required ? 'bg-blue-500' : 'bg-gray-300'
                                  }`}
                              >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${field.is_required ? 'translate-x-6' : 'translate-x-0.5'
                                  }`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCollectInfoField(actualIndex)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Options for select/checkbox/radio */}
                          {['select', 'checkbox', 'radio'].includes(field.field_type) && (
                            <div className="space-y-2 ml-9">
                              {field.options?.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-3">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(field.options || [])]
                                      newOptions[optIndex] = e.target.value
                                      updateCollectInfoField(actualIndex, { options: newOptions })
                                    }}
                                    className="flex-1 bg-transparent border-none text-gray-700 focus:outline-none"
                                    placeholder={`Option ${optIndex + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = field.options?.filter((_, i) => i !== optIndex) || []
                                      updateCollectInfoField(actualIndex, { options: newOptions })
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
                                  updateCollectInfoField(actualIndex, { options: newOptions })
                                }}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 ml-4"
                              >
                                <Plus className="w-3 h-3" />
                                Add Option
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Add Field Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFieldTypeDropdown(!showFieldTypeDropdown)}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Field
                </button>

                {/* Field Type Dropdown */}
                {showFieldTypeDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFieldTypeDropdown(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <div className="p-2">
                        <div className="text-sm font-medium text-gray-700 px-3 py-2">Select field type</div>
                        <div className="space-y-1">
                          {fieldTypeOptions.slice(2).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                addCollectInfoFieldWithType(option.value)
                                setShowFieldTypeDropdown(false)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                            >
                              <option.icon className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-900">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Preview Column */}
            <div className="lg:sticky lg:top-6">
              <CheckoutPreviewer
                productType={selectedType}
                thumbnail={checkoutImagePreview || thumbnailPreview}
                title={title}
                subtitle={subtitle}
                checkoutTitle={checkoutTitle}
                checkoutDescription={checkoutDescription}
                checkoutBottomTitle={checkoutBottomTitle}
                checkoutCtaButtonText={checkoutCtaButtonText}
                price={checkoutPrice || "0.00"}
                discountedPrice={checkoutDiscountedPrice}
                customFields={customFields}
                collectInfoFields={collectInfoFields}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Product-Specific Details */}
      {step === 5 && (
        <div className="p-6">
          {/* Only show header for non-digital products */}
          {selectedType !== 'digital' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedType && productTypes.find(t => t.id === selectedType)?.title} Configuration
              </h3>
              <p className="text-gray-600">
                Complete the final details specific to your {selectedType && productTypes.find(t => t.id === selectedType)?.title.toLowerCase()}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Digital Product Fields */}
            {selectedType === 'digital' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Digital File <span className="text-red-500">*</span>
                  </label>

                  {/* Upload Option */}
                  <div className="mb-4">
                    {digitalFile || digitalFileUrl ? (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <img src={uploadImg.src} alt="Upload" className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          {digitalFile ? (
                            <>
                              <p className="text-sm font-medium text-gray-900">{digitalFileName || digitalFile.name}</p>
                              <p className="text-xs text-gray-600 mt-1">File ready to upload</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900">Download link set</p>
                              <p className="text-xs text-gray-600 mt-1 truncate">{digitalFileUrl}</p>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDigitalFile(null)
                            setDigitalFileName('')
                            setDigitalFileUrl('')
                            if (digitalFileInputRef.current) {
                              digitalFileInputRef.current.value = ''
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => digitalFileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                      >
                        <img src={uploadImg.src} alt="Upload" className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">
                          Click to upload your digital file
                        </p>
                      </div>
                    )}

                    <input
                      ref={digitalFileInputRef}
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setDigitalFile(file)
                          setDigitalFileName(file.name)
                          setDigitalFileUrl('') // Clear URL when file is selected
                        }
                      }}
                      className="hidden"
                      accept="*/*"
                    />
                  </div>

                  {/* OR Divider */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or enter URL directly</span>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        id="digital-file-url"
                        value={digitalFileUrl}
                        onChange={(e) => {
                          setDigitalFileUrl(e.target.value)
                          setDigitalFile(null) // Clear file when URL is entered
                          setDigitalFileName('')
                        }}
                        placeholder="https://example.com/download/file.zip"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                        disabled={!!digitalFile}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Direct link to the downloadable file
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="download-instructions" className="block text-sm font-semibold text-gray-900 mb-2">
                    Download Instructions <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="download-instructions"
                    value={downloadInstructions}
                    onChange={(e) => setDownloadInstructions(e.target.value)}
                    placeholder="After purchase, you'll receive an email with the download link..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300 resize-none"
                    maxLength={300}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {downloadInstructions.length}/300 characters
                  </p>
                </div>
              </>
            )}

            {/* Custom Product Fields */}
            {selectedType === 'custom' && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      Custom Fields
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomFields([...customFields, { label: '', value: '' }])}
                      className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-purple-700"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Field
                    </button>
                  </div>

                  {customFields.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No custom fields added yet</p>
                      <button
                        type="button"
                        onClick={() => setCustomFields([{ label: '', value: '' }])}
                        className="mt-2 text-sm text-brand-600 hover:text-purple-700"
                      >
                        Add your first field
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customFields.map((field, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => {
                              const updated = [...customFields]
                              updated[index].label = e.target.value
                              setCustomFields(updated)
                            }}
                            placeholder="Label (e.g., Size)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          />
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => {
                              const updated = [...customFields]
                              updated[index].value = e.target.value
                              setCustomFields(updated)
                            }}
                            placeholder="Value (e.g., Large)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = customFields.filter((_, i) => i !== index)
                              setCustomFields(updated)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* eCourse Fields */}
            {selectedType === 'ecourse' && (
              <>
                <div>
                  <label htmlFor="course-duration" className="block text-sm font-semibold text-gray-900 mb-2">
                    Course Duration
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="course-duration"
                      value={courseDuration}
                      onChange={(e) => setCourseDuration(e.target.value)}
                      placeholder="e.g., 8 weeks, 30 hours, Self-paced"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      Course Modules
                    </label>
                    <button
                      type="button"
                      onClick={() => setCourseModules([...courseModules, ''])}
                      className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-purple-700"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Module
                    </button>
                  </div>

                  <div className="space-y-2">
                    {courseModules.map((module, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={module}
                            onChange={(e) => {
                              const updated = [...courseModules]
                              updated[index] = e.target.value
                              setCourseModules(updated)
                            }}
                            placeholder={`Module ${index + 1}: Introduction to...`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          />
                        </div>
                        {courseModules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = courseModules.filter((_, i) => i !== index)
                              setCourseModules(updated)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* URL/Media Fields */}
            {selectedType === 'url-media' && (
              <>
                <div>
                  <label htmlFor="media-url" className="block text-sm font-semibold text-gray-900 mb-2">
                    Destination URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      id="media-url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/content"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    URL where users will be redirected
                  </p>
                </div>

                <div>
                  <label htmlFor="button-text" className="block text-sm font-semibold text-gray-900 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    id="button-text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="View Content"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                    maxLength={50}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {buttonText.length}/50 characters
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back
            </button>
            <button
              type="button"
              onClick={isEditMode ? handleUpdateProduct : handleCreateProduct}
              disabled={
                isSubmitting ||
                (selectedType === 'digital' && !digitalFileUrl && !digitalFile) ||
                (selectedType === 'url-media' && !mediaUrl)
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}