require 'xcodeproj'

project_path = '/Users/rompragasa/Documents/AntiGravity Projects/Origin Command/OriginCommand.xcodeproj'
project = Xcodeproj::Project.open(project_path)

main_group = project.main_group['OriginCommand']
unless main_group
  # If earlier script failed to find it, maybe it created groups in main_group?
  # But we saw "Ref created" output, so they exist somewhere.
  # If main_group['OriginCommand'] exists, use it.
  main_group = project.main_group
end

files = [
  { group: 'Models', file: 'AppError.swift' },
  { group: 'Models', file: 'DevicePreferences.swift' },
  { group: 'Managers', file: 'PersistenceManager.swift' },
  { group: 'Managers', file: 'ErrorHandler.swift' },
  { group: 'Managers', file: 'BluOSAPIClient.swift' },
  { group: 'Managers', file: 'HapticManager.swift' }
]

files.each do |item|
  group_name = item[:group]
  filename = item[:file] # e.g. AppError.swift
  
  # Find group
  subgroup = main_group[group_name]
  next unless subgroup
  
  # Find the reference. It might have the LONG path.
  # We search by name or by confirming it ends with filename
  ref = subgroup.files.find { |f| f.path.end_with?(filename) }
  
  if ref
    puts "Fixing path for #{ref.path}"
    # Set path to just the filename (basename)
    # This assumes the group 'Models' points to 'Models' directory correctly.
    ref.path = filename
    puts "New path: #{ref.path}"
  else
    puts "Could not find reference for #{filename} in #{group_name}"
    # If not found, create it correctly?
    ref = subgroup.new_reference(filename)
    puts "Created new ref: #{filename}"
  end
end

project.save
puts "Project fixed."
